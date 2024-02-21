async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    // Pass the deployer's address as the initialOwner argument to the contract's constructor
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(deployer.address); // Providing the deployer's address as the initial owner
  
    console.log("Lottery contract deployed to:", lottery.address);
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
