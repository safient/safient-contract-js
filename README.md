# Safient Claims SDK

JavaScript SDK to manage and interact with the safe claims on Safient protocol.

## Installation

```bash
  git clone https://github.com/safient/safient-claims-js.git
  cd safient-claims-js
  npm install
```

## Running Tests

Create an `.env` file in the `root` folder with `USER_API_KEY`, `USER_API_SECRET`

<br />

Terminal 1

```bash
  npx tsc
  npm run chain
```

Terminal 2

```bash
  npm run deploy
```

Terminal 3

```bash
  npm run test
```

## Package Installation

```bash
  npm i @safient/claims
```

## Before Initialization

```javascript
// If not injected web3 provider, create a jsonRpcProvider
const { JsonRpcProvider } = require('@ethersproject/providers');
const provider = new JsonRpcProvider('http://localhost:8545');

// Get signer and chainId from provider
(async () => {
  const signer = await provider.getSigner();
  const providerNetwork = await provider.getNetwork();
  const chainId = providerNetwork.chainId;
})();
```

## Initialization

```javascript
import { SafientClaims } from 'safient-claims';

const sc = new SafientClaims(signer, chainId, seed);
```

### Arbitrator

```
sc.arbitrator.getArbitrationFee
```

### SafientMain

```
sc.safientMain.createSafe
sc.safientMain.createClaim
sc.safientMain.submitEvidence
sc.safientMain.depositSafeFunds
sc.safientMain.recoverSafeFunds
sc.safientMain.setTotalClaimsAllowed
sc.safientMain.getTotalNumberOfSafes
sc.safientMain.getTotalNumberOfClaims
sc.safientMain.getAllClaims
sc.safientMain.getSafeBySafeId
sc.safientMain.getClaimByClaimId
sc.safientMain.getClaimsOnSafeBySafeId
sc.safientMain.getClaimStatus
sc.safientMain.getTotalClaimsAllowed
sc.safientMain.getSafientMainContractBalance
sc.safientMain.gaurdianProof
```

## Usage

### Arbitrator

#### Get Arbitration Fee

```javascript
const getArbitrationFee = async () => {
  try {
    const fee = await sc.arbitrator.getArbitrationFee();
    console.log(fee);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Returns           | Type     | Description                |
| :---------------- | :------- | :------------------------- |
| `Arbitration fee` | `number` | Arbitration fee in **ETH** |

### SafientMain

#### Create Safe

```javascript
const createSafe = async (inheritorAddress, safeIdOnThreadDB, metaevidenceURI, value) => {
  try {
    const tx = await sc.safientMain.createSafe(inheritorAddress, safeIdOnThreadDB, metaevidenceURI, value);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                                                                        |
| :----------------- | :------- | :--------------------------------------------------------------------------------- |
| `inheritorAddress` | `string` | **Required**. Address of the beneficiary who can claim to inherit this safe        |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB                                                  |
| `metaevidenceURI`  | `string` | **Required**. IPFS URI pointing to the metaevidence related to arbitration details |
| `value`            | `string` | **Required**. Safe maintanence fee in **Gwei**, minimum arbitration fee required   |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Create Claim

Before creating the claim :

```javascript
// Get the threadDB connection object which includes Client and threadId
(async () => {
  const conn = await sc.safientMain.connectUser();
})();
```

```javascript
const createClaim = async (conn, did, safeIdOnThreadDB, evidenceURI) => {
  try {
    const tx = await sc.safientMain.createClaim(conn, did, safeIdOnThreadDB, evidenceURI);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                                                                    |
| :----------------- | :------- | :----------------------------------------------------------------------------- |
| `conn`             | `number` | **Required**. ThreadDB connection object resolved from connectUser method      |
| `did`              | `string` | **Required**. DID of the user                                                  |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB                                              |
| `evidenceURI`      | `string` | **Required**. IPFS URI pointing to the evidence submitted by the claim creator |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Submit Evidence

```javascript
const submitEvidence = async (disputeId, evidenceURI) => {
  try {
    const tx = await sc.safientMain.submitEvidence(disputeId, evidenceURI);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter     | Type     | Description                                                                    |
| :------------ | :------- | :----------------------------------------------------------------------------- |
| `disputeId`   | `number` | **Required**. Id of the dispute representing the claim                         |
| `evidenceURI` | `string` | **Required**. IPFS URI pointing to the evidence submitted by the claim creator |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Deposit Safe Funds

```javascript
const depositSafeFunds = async (safeIdOnThreadDB, value) => {
  try {
    const tx = await sc.safientMain.depositSafeFunds(safeIdOnThreadDB, value);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                       |
| :----------------- | :------- | :-------------------------------- |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB |
| `value`            | `string` | **Required**. Funds in **Gwei**   |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Recover Safe Funds

> Only **safe's current owner** can execute this

```javascript
const recoverSafeFunds = async (safeIdOnThreadDB) => {
  try {
    const tx = await sc.safientMain.recoverSafeFunds(safeIdOnThreadDB);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                       |
| :----------------- | :------- | :-------------------------------- |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Set Total Claims Allowed

> Only **SafientMain contract deployer** can execute this

```javascript
const setTotalClaimsAllowed = async (claimsAllowed) => {
  try {
    const tx = await sc.safientMain.setTotalClaimsAllowed(claimsAllowed);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter       | Type     | Description                                  |
| :-------------- | :------- | :------------------------------------------- |
| `claimsAllowed` | `number` | **Required**. Number of total claims allowed |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Get Total Number Of Safes

```javascript
const getTotalNumberOfSafes = async () => {
  try {
    const numOfSafes = await sc.safientMain.getTotalNumberOfSafes();
    console.log(numOfSafes);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Returns              | Type     | Description                                  |
| :------------------- | :------- | :------------------------------------------- |
| `Total no. of safes` | `number` | Total number of safes created on SafientMain |

#### Get Total Number Of Claims

```javascript
const getTotalNumberOfClaims = async () => {
  try {
    const numOfClaims = await sc.safientMain.getTotalNumberOfClaims();
    console.log(numOfClaims);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Returns               | Type     | Description                                   |
| :-------------------- | :------- | :-------------------------------------------- |
| `Total no. of claims` | `number` | Total number of claims created on SafientMain |

#### Get Safe By Safe Id

```javascript
const getSafeBySafeId = async (safeIdOnThreadDB) => {
  try {
    const safe = await sc.safientMain.getSafeBySafeId(safeIdOnThreadDB);
    console.log(safe);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                       |
| :----------------- | :------- | :-------------------------------- |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB |

<br />

| Returns | Type   | Description               |
| :------ | :----- | :------------------------ |
| `Safe`  | `Safe` | Safe containing safe data |

<br />

> Type **Safe**

| Property           | Type       | Description                                           |
| :----------------- | :--------- | :---------------------------------------------------- |
| `safeId`           | `string`   | Safe Id on threadDB                                   |
| `safeCreatedBy`    | `string`   | Address of the safe creator                           |
| `safeCurrentOwner` | `string`   | Address of the current safe owner                     |
| `safeInheritor`    | `string`   | Address of the safe inheritor (beneficiary)           |
| `metaEvidenceId`   | `Bigumber` | Id used to uniquely identify a piece of meta-evidence |
| `claimsCount`      | `Bigumber` | Number of claims made on this safe                    |
| `safeFunds`        | `Bigumber` | Total safe funds in **Gwei**                          |

#### Get Claim By Claim Id

```javascript
const getClaimByClaimId = async (claimId) => {
  try {
    const claim = await sc.safientMain.getClaimByClaimId(claimId);
    console.log(claim);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter | Type     | Description                   |
| :-------- | :------- | :---------------------------- |
| `claimId` | `number` | **Required**. Id of the claim |

<br />

| Returns | Type    | Description                 |
| :------ | :------ | :-------------------------- |
| `Claim` | `Claim` | Claim containing claim data |

<br />

> Type **Claim**

| Property          | Type        | Description                                                                    |
| :---------------- | :---------- | :----------------------------------------------------------------------------- |
| `safeId`          | `string`    | Safe Id on threadDB                                                            |
| `disputeId`       | `BigNumber` | Id of the dispute representing the claim                                       |
| `claimedBy`       | `string`    | Address of the claim creator                                                   |
| `metaEvidenceId`  | `BigNumber` | Id used to uniquely identify a piece of meta-evidence                          |
| `evidenceGroupId` | `Bigumber`  | Id used to identify a group of evidence related to a dispute                   |
| `status`          | `number`    | Claim status represented by **0**, **1**, **2** or **3**                       |
| `result`          | `string`    | Claim result represented by **Passed**, **Failed** or **Refused To Arbitrate** |

#### Get All Claims

```javascript
const getAllClaims = async () => {
  try {
    const claims = await sc.safientMain.getAllClaims();
    console.log(claims);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Returns           | Type      | Description                                    |
| :---------------- | :-------- | :--------------------------------------------- |
| `Array of claims` | `Claim[]` | Array of all the claims created on SafientMain |

#### Get All Claims On A Safe By Safe Id

```javascript
const getClaimsOnSafeBySafeId = async (safeIdOnThreadDB) => {
  try {
    const claims = await sc.safientMain.getClaimsOnSafeBySafeId(safeIdOnThreadDB);
    console.log(claims);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                       |
| :----------------- | :------- | :-------------------------------- |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB |

<br />

| Returns           | Type      | Description                       |
| :---------------- | :-------- | :-------------------------------- |
| `Array of claims` | `Claim[]` | Array of all the claims on a safe |

#### Get Claim Status

```javascript
const getClaimStatus = async (claimId) => {
  try {
    const claimStatus = await sc.safientMain.getClaimStatus(claimId);
    console.log(claimStatus);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter | Type     | Description                   |
| :-------- | :------- | :---------------------------- |
| `claimId` | `number` | **Required**. Id of the claim |

<br />

| Returns        | Type     | Description                                                                                |
| :------------- | :------- | :----------------------------------------------------------------------------------------- |
| `claim status` | `string` | Claim status represented by **Active**, **Passed**, **Failed** or **Refused To Arbitrate** |

#### Get Total No. Of Claims Allowed On A Safe

```javascript
const getTotalClaimsAllowed = async () => {
  try {
    const claimsAllowed = await sc.safientMain.getTotalClaimsAllowed();
    console.log(claimsAllowed);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Returns                       | Type     | Description                           |
| :---------------------------- | :------- | :------------------------------------ |
| `Total no. of claims allowed` | `number` | Total no. of claims allowed on a safe |

#### Get SafientMain Contract Total Balance

```javascript
const getSafientMainContractBalance = async () => {
  try {
    const balance = await sc.safientMain.getSafientMainContractBalance();
    console.log(balance);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Returns                        | Type     | Description                                      |
| :----------------------------- | :------- | :----------------------------------------------- |
| `SafientMain contract balance` | `number` | Total balance of SafientMain contract in **ETH** |
