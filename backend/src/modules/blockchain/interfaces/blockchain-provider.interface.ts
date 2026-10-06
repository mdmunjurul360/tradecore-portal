export interface IBlockchainProvider {
  /**
   * Generates a new wallet address and private key for the given network.
   */
  generateWallet(networkId: string): Promise<{ address: string; privateKeyEncrypted: string }>;

  /**
   * Validates if the given address is valid for the network.
   */
  validateAddress(address: string, networkId: string): Promise<boolean>;

  /**
   * Gets the current balance of the address.
   */
  getBalance(address: string, networkId: string): Promise<string>;

  /**
   * Retrieves transaction details from the blockchain.
   */
  getTransaction(txHash: string, networkId: string): Promise<any>;

  /**
   * Broadcasts a signed transaction to the blockchain network.
   */
  broadcastTransaction(signedTx: string, networkId: string): Promise<string>;

  /**
   * Gets the latest block number.
   */
  getLatestBlock(networkId: string): Promise<number>;

  /**
   * Gets the number of confirmations for a given transaction hash.
   */
  getConfirmations(txHash: string, networkId: string): Promise<number>;
}
