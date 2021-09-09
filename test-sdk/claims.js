const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const chai = require('chai');

require('dotenv').config();

const expect = chai.expect;
chai.use(require('chai-as-promised'));

const metaevidenceOrEvidenceURI =
  'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/';

const { SafientClaims, Types } = require('../dist/index');

describe('safientMain', async () => {
  let safeId = [];
  let provider, chainId;
  let safientMainAdminSigner,
    safeCreatorSigner,
    beneficiarySigner,
    accountXSigner,
    safeCreatorAddress,
    beneficiaryAddress;
  let claimIdOfSafeId0, claimIdOfSafeId1, claimIdOfSafeId2;

  describe('Safient Claims Test Flow', async () => {
    before(async () => {
      // Random safe id's
      for (let i = 0; i < 3; i++) {
        safeId.push(Math.random().toString(36).substr(2, 5));
      }

      // Provider and ChainId
      provider = new JsonRpcProvider('http://localhost:8545');
      const providerNetworkData = await provider.getNetwork();
      chainId = providerNetworkData.chainId;

      // Signers, Signer addresses
      safientMainAdminSigner = await provider.getSigner(0);
      safeCreatorSigner = await provider.getSigner(1);
      beneficiarySigner = await provider.getSigner(2);
      accountXSigner = await provider.getSigner(3);

      safeCreatorAddress = await safeCreatorSigner.getAddress();
      beneficiaryAddress = await beneficiarySigner.getAddress();
    });

    it('Should allow safe creators to create a safe', async () => {
      const sc = new SafientClaims(safeCreatorSigner, chainId);

      const arbitrationFee = await sc.arbitrator.getArbitrationFee(); // 0.001 ETH
      const guardianFee = 0.01; // 0.01 ETH

      const beforeTotalNumberOfSafes = await sc.safientMain.getTotalNumberOfSafes();
      const beforeContractBalance = await sc.safientMain.getContractBalance();

      // SUCCESS : create a safe
      await sc.safientMain.createSafe(
        beneficiaryAddress, // 2nd account
        safeId[0],
        Types.ClaimType.ArbitrationBased,
        0, // 0 seconds because opting ArbitrationBased
        metaevidenceOrEvidenceURI,
        String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
      );

      const afterContractBalance = await sc.safientMain.getContractBalance();

      expect(afterContractBalance).to.equal(beforeContractBalance + 0.011);
      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(beforeTotalNumberOfSafes + 1);

      const safe = await sc.safientMain.getSafeBySafeId(safeId[0]);
      expect(safe.beneficiary).to.equal(beneficiaryAddress);
      expect(ethers.utils.formatEther(safe.funds)).to.equal('0.011');
      expect(Number(safe.signalingPeriod)).to.equal(0); // 0 seconds
      expect(Number(safe.endSignalTime)).to.equal(0);
      expect(Number(safe.latestSignalTime)).to.equal(0);
      expect(Number(safe.claimType)).to.equal(1); // ArbitrationBased

      // FAILURE : ID of the safe on threadDB is not passed
      await expect(
        sc.safientMain.createSafe(
          beneficiaryAddress,
          '',
          Types.ClaimType.ArbitrationBased,
          0,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : beneficiary is an zero address
      await expect(
        sc.safientMain.createSafe(
          '0x0',
          safeId[0],
          Types.ClaimType.ArbitrationBased,
          0,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : safe creator and beneficiary are same
      await expect(
        sc.safientMain.createSafe(
          safeCreatorAddress,
          safeId[0],
          Types.ClaimType.ArbitrationBased,
          0, // 0 seconds (6 * 0) because opting ArbitrationBased
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);
    });

    it('Should allow safe beneficiaries to create a safe (syncSafe)', async () => {
      const sc = new SafientClaims(beneficiarySigner, chainId);

      const beforeTotalNumberOfSafes = await sc.safientMain.getTotalNumberOfSafes();

      // SUCCESS : create a safe(for claimType - SignalBased & signal - won't signal)
      await sc.safientMain.syncSafe(
        safeCreatorAddress, // 2nd account
        safeId[1],
        Types.ClaimType.SignalBased,
        6, // 6 seconds because opting SignalBased
        '', // no metaevidence because SignalBased
        '' // no safe maintenence fee because SignalBased
      );

      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(beforeTotalNumberOfSafes + 1);

      const safe = await sc.safientMain.getSafeBySafeId(safeId[1]);
      expect(safe.createdBy).to.equal(safeCreatorAddress);
      expect(safe.beneficiary).to.equal(beneficiaryAddress);
      expect(Number(safe.signalingPeriod)).to.equal(6); // 6 seconds
      expect(Number(safe.endSignalTime)).to.equal(0);
      expect(Number(safe.latestSignalTime)).to.equal(0);
      expect(Number(safe.claimType)).to.equal(0); // SignalBased

      // SUCCESS : create another safe with safeId3(for claimType - SignalBased & signal - will signal)
      const sc2 = new SafientClaims(safeCreatorSigner, chainId);
      await sc2.safientMain.createSafe(
        beneficiaryAddress, // 2nd account
        safeId[2],
        Types.ClaimType.SignalBased,
        6,
        '',
        ''
      );
    });

    it('Should allow beneficiaries to create a claim (ArbitrationBased)', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : only beneficiary of the safe can create the claim
      await expect(sc.safientMain.createClaim(safeId[0], metaevidenceOrEvidenceURI)).to.be.rejectedWith(Error);

      sc = new SafientClaims(beneficiarySigner, chainId);

      // FAILURE : safe does not exist
      await expect(sc.safientMain.createClaim('123', metaevidenceOrEvidenceURI)).to.be.rejectedWith(Error);

      const beforeTotalNumberOfClaims = await sc.safientMain.getTotalNumberOfClaims();

      // SUCCESS : create a claim (ArbitrationBased) on safeId1
      const tx = await sc.safientMain.createClaim(safeId[0], metaevidenceOrEvidenceURI);
      const txReceipt = await tx.wait();
      claimIdOfSafeId0 = txReceipt.events[2].args[2];

      expect(await sc.safientMain.getTotalNumberOfClaims()).to.equal(beforeTotalNumberOfClaims + 1);

      const claimOnSafeId0 = await sc.safientMain.getClaimByClaimId(claimIdOfSafeId0);
      expect(claimOnSafeId0.claimedBy).to.equal(beneficiaryAddress);
      expect(claimOnSafeId0.status).to.equal(0);
    });

    it('Should allow beneficiaries to create a claim (SignalBased)', async () => {
      const sc = new SafientClaims(beneficiarySigner, chainId);

      let tx, txReceipt;

      // SUCCESS : create claim on safeId2
      tx = await sc.safientMain.createClaim(safeId[1], '');
      txReceipt = await tx.wait();
      claimIdOfSafeId1 = txReceipt.events[0].args[2];

      const safeWithSafeId1 = await sc.safientMain.getSafeBySafeId(safeId[1]);
      expect(safeWithSafeId1.claimsCount).to.equal(1);

      const claimOnSafeId1 = await sc.safientMain.getClaimByClaimId(claimIdOfSafeId1);
      expect(claimOnSafeId1.claimedBy).to.equal(beneficiaryAddress);
      expect(claimOnSafeId1.status).to.equal(0);

      // SUCCESS : create claim on safeId3
      tx = await sc.safientMain.createClaim(safeId[2], '');
      txReceipt = await tx.wait();
      claimIdOfSafeId2 = txReceipt.events[0].args[2];

      const safeWithSafeId2 = await sc.safientMain.getSafeBySafeId(safeId[2]);
      expect(safeWithSafeId2.claimsCount).to.equal(1);

      const claimOnSafeId2 = await sc.safientMain.getClaimByClaimId(claimIdOfSafeId2);
      expect(claimOnSafeId2.claimedBy).to.equal(beneficiaryAddress);
      expect(claimOnSafeId2.status).to.equal(0);
    });

    it('Should allow safe creator to SIGNAL when the safe is claimed', async () => {
      const sc = new SafientClaims(safeCreatorSigner, chainId);

      // SUCCESS: Signal safeId3 - results in a failed claim
      await sc.safientMain.sendSignal(safeId[2]);

      const safeWithSafeId3 = await sc.safientMain.getSafeBySafeId(safeId[2]);
      expect(Number(safeWithSafeId3.latestSignalTime)).greaterThan(0);

      // mine a new block after 6 seconds
      const mineNewBlock = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(provider.send('evm_mine'));
        }, 7000);
      });
      const result = await mineNewBlock;

      // check claim status (ArbitrationBased & SignalBased)
      const safeId1ClaimResult = await sc.safientMain.getClaimStatus(safeId[0], claimIdOfSafeId0);
      expect(safeId1ClaimResult).to.equal(0); // claim is Active (Kleros has not given a ruling yet)

      const safeId2ClaimResult = await sc.safientMain.getClaimStatus(safeId[1], claimIdOfSafeId1);
      expect(safeId2ClaimResult).to.equal(1); // claim is Passed (safe creator didn't signal)

      const safeId3ClaimResult = await sc.safientMain.getClaimStatus(safeId[2], claimIdOfSafeId2);
      expect(safeId3ClaimResult).to.equal(2); // claim is Failed (safe creator gave a signal)
    });

    it('Should give ruling on a claim', async () => {
      const sc = new SafientClaims(safientMainAdminSigner, chainId);

      await sc.arbitrator.giveRulingCall(claimIdOfSafeId0, 1);

      const safeId1ClaimResult = await sc.safientMain.getClaimStatus(safeId[0], claimIdOfSafeId0);
      expect(safeId1ClaimResult).to.equal(1); // claim is Passed (Kleros has given a ruling)
    });

    it('Should allow users to deposit funds in a safe', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      const beforeContractBalance = await sc.safientMain.getContractBalance();

      // SUCCESS : deposit funds in a safe
      await sc.safientMain.depositFunds(safeId[0], String(ethers.utils.parseEther('2')));

      const afterContractBalance = await sc.safientMain.getContractBalance();

      expect(afterContractBalance).to.equal(beforeContractBalance + 2);
    });

    it('Should allow current owner of the to withdraw funds in the safe', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : only safe owner can withdraw the funds
      await expect(sc.safientMain.withdrawFunds(safeId[0])).to.be.rejectedWith(Error);

      sc = new SafientClaims(safeCreatorSigner, chainId);

      const beforeContractBalance = await sc.safientMain.getContractBalance();

      const safeWithSafeId0 = await sc.safientMain.getSafeBySafeId(safeId[0]);
      const funds = Number(ethers.utils.formatEther(safeWithSafeId0.funds));

      // SUCCESS : withdraw funds from a safe
      await sc.safientMain.withdrawFunds(safeId[0]);

      const afterContractBalance = await sc.safientMain.getContractBalance();

      expect(afterContractBalance).to.equal(beforeContractBalance - funds);

      // FAILURE : no funds remaining in the safe
      await expect(sc.safientMain.withdrawFunds(safeId[0])).to.be.rejectedWith(Error);
    });

    it('Should get the safe by its Safe Id', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      const safe = await sc.safientMain.getSafeBySafeId(safeId[0]);

      expect(safe.createdBy).to.equal(safeCreatorAddress);
      expect(safe.funds).to.equal(0);
    });

    it('Should get the claim by its Claim Id', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      const claim = await sc.safientMain.getClaimByClaimId(claimIdOfSafeId0);

      expect(claim.claimedBy).to.equal(beneficiaryAddress);
      expect(claim.claimType).to.equal(1);
    });

    it('Should get the total number of safes on the contract', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      expect(await sc.safientMain.getTotalNumberOfSafes()).to.greaterThan(0);
    });

    it('Should get the total number of claims on the contract', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      expect(await sc.safientMain.getTotalNumberOfClaims()).to.greaterThan(0);
    });

    it('Should get the SafientMain contract balance', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      expect(await sc.safientMain.getContractBalance()).to.equal(0);
    });
  });
});