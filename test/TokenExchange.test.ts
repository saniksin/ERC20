import { MyERC20Token } from "../typechain-types";
import { loadFixture, ethers, expect } from "./setup";

describe("TokenExchange", function() {
  async function deploy() {
    const [owner, buyer] = await ethers.getSigners();

    const GuideDAOToken = await ethers.getContractFactory("MyERC20Token");
    const gtk = await GuideDAOToken.deploy(owner.address, 'MyERC20Token', 'GTK', 18, 5);
    await gtk.waitForDeployment();

    const TokenExchange = await ethers.getContractFactory("TokenExchange");
    const exch = await TokenExchange.deploy(gtk.target);
    await exch.waitForDeployment();

    return { gtk, exch, owner, buyer }
  } 

  async function withDecimals(gtk: MyERC20Token, value: bigint): Promise<bigint> {
    return value * 10n ** await gtk.decimals();
  }

  it("should allow to buy", async function() {
    const { gtk, exch, owner, buyer } = await loadFixture(deploy);

    const tokenInStock = 3n;
    const tokenWithDecimals = await withDecimals(gtk, tokenInStock);
    const transferTx = await gtk.transfer(exch.target, tokenWithDecimals);
    await transferTx.wait();

    expect(await gtk.balanceOf(exch.target)).to.eq(tokenWithDecimals);

    await expect(transferTx).to.changeTokenBalances(
      gtk, [owner, exch], [-tokenWithDecimals, tokenWithDecimals]
    )

    const tokenToBuy = 1n;
    const value = ethers.parseEther(tokenToBuy.toString());
    const buyTx = await exch.connect(buyer).buy({value: value});

    await buyTx.wait;

    await expect(buyTx).to.changeEtherBalances(
      [buyer, exch],
      [-value, value]
    );

    await expect(buyTx).to.changeTokenBalances(
      gtk, [exch, buyer], [-value, value]
    )
  });

  it("should allow to sell", async function() {
    const { gtk, owner, exch, buyer } = await loadFixture(deploy);

    const value = await withDecimals(gtk, 2n);
    const transferTx = await gtk.transfer(buyer.address, value);
    await transferTx.wait();

    await expect(transferTx).to.changeTokenBalances(
      gtk, [owner, buyer], [-value, value]
    )

    const topUpTx = await exch.topUp({value: ethers.parseEther("5")});
    await topUpTx.wait();

    await expect(topUpTx).to.changeEtherBalances(
      [owner, exch], [-ethers.parseEther("5"), ethers.parseEther("5")]
    )

    const tokenToSell = 1n;
    const valueTosell = ethers.parseEther(tokenToSell.toString());

    const approveTx = await gtk.connect(buyer).approve(exch.target, valueTosell)
    await approveTx.wait();

    expect(await gtk.allowance(buyer, exch)).to.be.eq(valueTosell)

    const sellTx = await exch.connect(buyer).sell(valueTosell);
    await sellTx.wait();

    await expect(sellTx).changeEtherBalances([buyer, exch], [valueTosell, -valueTosell]);

    await expect(sellTx).to.changeTokenBalances(
      gtk, [exch, buyer], [valueTosell, -valueTosell]
    );
  })

});