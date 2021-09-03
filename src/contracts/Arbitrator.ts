import { ContractAddress, ContractABI, Signer } from '../types/Types';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { Logger } from '@ethersproject/logger';
import networks from '../utils/networks.json';
import data from '../abis/AutoAppealableArbitrator.json';
export class Arbitrator {
  private signer: Signer;
  private arbitratorABI: ContractABI;
  private arbitratorAddress: ContractAddress;
  private logger: Logger;

  /**
   * Arbitrator Constructor
   * @param signer - Signer object
   * @param chainId - Provider chainId
   */
  constructor(signer: Signer, chainId: number) {
    this.logger = Logger.globalLogger();
    this.signer = signer;
    this.arbitratorABI = data.abi;

    const network = Object.values(networks).find((network) => chainId === network.chainId);

    network !== undefined && network.addresses.AutoAppealableArbitrator !== ''
      ? (this.arbitratorAddress = network.addresses.AutoAppealableArbitrator)
      : this.logger.throwError(`Arbitrator contract not deployed on network with chain id: ${chainId}`);
  }

  /**
   * Get the Arbitrator contract instance
   * @returns The Arbitrator contract instance associated with the signer
   */
  private getContractInstance = async (): Promise<Contract> => {
    try {
      const contractInstance = new Contract(this.arbitratorAddress, this.arbitratorABI, this.signer);
      return contractInstance;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the arbitration fee
   * @returns The arbitration fee in ETH
   */
  getArbitrationFee = async (): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const arbitrationFee: BigNumber = await contract.arbitrationCost(0x0);
      return Number(formatEther(arbitrationFee));
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  giveRulingCall = async (disputeId: number, ruling: number): Promise<boolean> => {
    try {
      const contract = await this.getContractInstance();
      await contract.giveRuling(disputeId, ruling);
      return true;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };
}
