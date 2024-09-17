import { loadFixture, ethers, SignerWithAddress, expect } from "./setup";
import type { MyERC20PermitToken, Proxy } from "../typechain-types";

interface ERC2612PermitMessage {
    owner: string;
    spender: string;
    value: number | string;
    nonce: number | string;
    deadline: number | string;
}

interface RSV {
    r: string,
    s: string,
    v: number;
}

interface Domain {
    name: string,
    version: string,
    chainId: number | bigint,
    verifyingContract: string;
}

function splitSignatureToRSV(signature: string): RSV {
    const r = "0x" + signature.substring(2).substring(0, 64);
    const s = "0x" + signature.substring(2).substring(64, 128);
    const v = parseInt(signature.substring(2).substring(128, 130), 16);

    return { r, s, v }
}

async function signERC2612Permit(
    token: string,
    owner: string,
    spender: string,
    value: number | string,
    deadline: number,
    nonce: number | string,
    signer: SignerWithAddress
): Promise<ERC2612PermitMessage & RSV> {
    const message: ERC2612PermitMessage = {
        owner,
        spender,
        value,
        nonce,
        deadline
    };
    
    const domain: Domain = {
        name: "MyERC20PermitToken",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: token,
    };

    const typedData = createTypedERC2612Data(message, domain);

    const rawSignature = await signer.signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message
    );

    const sig = splitSignatureToRSV(rawSignature);
    return { ...sig, ...message}
}

function createTypedERC2612Data(message: ERC2612PermitMessage, domain: Domain) {
    return {
        types: {
            Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ]
        },
        primaryType: "Permit",
        domain,
        message,
    };
}

describe("MyPermitToken", function() {
    async function deploy() {
        const [ user1, user2 ] = await ethers.getSigners();

        const TokenFactory = await ethers.getContractFactory("MyERC20PermitToken");
        const token: MyERC20PermitToken = await TokenFactory.deploy();

        const ProxyFactory = await ethers.getContractFactory("Proxy");
        const proxy: Proxy = await ProxyFactory.deploy();

        return { token, proxy, user1, user2 };
    };

    it("should permit", async function() {
        const { token, proxy, user1, user2 } = await loadFixture(deploy);

        const tokenAddr = (token.target).toString();
        const owner = user1.address;
        const spender = user2.address;
        const amount = 15;
        const deadline = Math.floor(Date.now() / 1000) + 1000;
        const nonce = 0;
        const amountToSpend = 10;

        const result = await signERC2612Permit(
            tokenAddr,
            owner,
            spender,
            amount,
            deadline,
            nonce,
            user1
        );
        
        //console.log(result);

        // console.log("NONCES", await token.nonces(owner));
        // console.log("ALLOWANCE BEFORE", await token.allowance(owner, spender));
        expect(await token.nonces(owner)).to.eq(0n)
        expect(await token.allowance(owner, spender)).to.eq(0n)

        const tx = await proxy.connect(user2).doSend(
            tokenAddr,
            owner,
            spender,
            amount,
            deadline,
            result.v,
            result.r,
            result.s,
        );
        await tx.wait();
        
        // console.log("NONCES", await token.nonces(owner));
        // console.log("ALLOWANCE BEFORE", await token.allowance(owner, spender));
        expect(await token.nonces(owner)).to.eq(1n)
        expect(await token.allowance(owner, spender)).to.eq(15n)

        const transferTx = await token.connect(user2).transferFrom(owner, spender, amountToSpend);
        await transferTx.wait();

        await expect(transferTx).to.changeTokenBalance(token, user2, amountToSpend);

        // console.log("NONCES", await token.nonces(owner));
        // console.log("ALLOWANCE BEFORE", await token.allowance(owner, spender));
        expect(await token.nonces(owner)).to.eq(1n)
        expect(await token.allowance(owner, spender)).to.eq(5n)
    });
});