// ------------------- Modal Setup -------------------
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");
const modalCloseButton = document.getElementById("modal-close-button");
modalCloseButton.addEventListener("click", () => (modal.style.display = "none"));

// Attach showModal event programmatically
document.querySelectorAll('.thumbnail').forEach(thumbnail => {
  thumbnail.addEventListener('click', () => {
    modal.style.display = "flex";
    modalContent.src = thumbnail.src;
  });
});

// ------------------- Wallet / FBA Setup -------------------
const connectButton = document.getElementById("connect-wallet");
const walletAddressEl = document.getElementById("wallet-address");
const fbaBalanceEl = document.getElementById("fba-balance");

// Replace with your actual FBA contract address
const FBA_CONTRACT = "TNW5ABkp3v4jfeDo1vRVjxa3gtnoxP3DBN";

// TRC20 ABI (simplified)
const FBA_ABI = [
  { "constant":true, "inputs":[{"name":"_owner","type":"address"}], "name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function" },
  { "constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"type":"function" },
  { "constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function" }
];

// Utility to wait for tronWeb
function waitForTronWeb(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const interval = 100;
    let waited = 0;
    const timer = setInterval(() => {
      if (window.tronWeb && tronWeb.ready) {
        clearInterval(timer);
        resolve(window.tronWeb);
      } else {
        waited += interval;
        if (waited >= timeout) {
          clearInterval(timer);
          reject(new Error("tronWeb not ready"));
        }
      }
    }, interval);
  });
}

// ------------------- Connect Wallet -------------------
async function connectWallet() {
  try {
    if (!window.tronLink) return alert("Please install TronLink!");

    await window.tronLink.request({ method: "tron_requestAccounts" });
    await waitForTronWeb(8000);

    const wallet = tronWeb.defaultAddress.base58;
    walletAddressEl.textContent = `Wallet: ${wallet}`;

    const contract = await tronWeb.contract(FBA_ABI, FBA_CONTRACT);
    const decimals = BigInt(await contract.decimals().call());
    const rawBal = BigInt(await contract.balanceOf(wallet).call());

    const balanceFloat = Number(rawBal) / Number(10n ** decimals);
    fbaBalanceEl.textContent = balanceFloat.toFixed(2);

    connectButton.textContent = "Connected ✅";
    connectButton.disabled = true;

    // Highlight NFTs if user has any FBA tokens
    highlightOwnedNFTs(contract, wallet, decimals);
  } catch (err) {
    console.error("connectWallet error:", err);
    alert("Wallet connection failed: " + (err.message || err));
  }
}

connectButton.addEventListener("click", connectWallet);

// ------------------- Highlight Owned NFTs -------------------
async function highlightOwnedNFTs(contract, wallet, decimals) {
  const items = document.querySelectorAll(".gallery .item");
  for (let item of items) {
    const rawBal = BigInt(await contract.balanceOf(wallet).call());
    const balanceFloat = Number(rawBal) / Number(10n ** decimals);
    if (balanceFloat > 0) {
      item.style.border = "2px solid #00ff9d";
    } else {
      item.style.border = "initial";
    }
  }
}

// ------------------- Mint / Buy NFTs -------------------
// Replace with your actual BloodyAliensNFT deployed contract address
const NFT_CONTRACT = "YOUR_DEPLOYED_BLOODY_ALIENS_CONTRACT"; // e.g., TRxxxxxxxxxxxx

document.querySelectorAll(".mint-btn").forEach(button => {
  button.addEventListener("click", async (e) => {
    if (!window.tronWeb || !tronWeb.ready) {
      return alert("Please connect your wallet first!");
    }

    const item = e.target.closest(".item");
    const tokenId = item.dataset.tokenId;

    try {
      const wallet = tronWeb.defaultAddress.base58;
      const nftContract = await tronWeb.contract().at(NFT_CONTRACT);

      // Call mintPublic() in your NFT contract
      const tx = await nftContract.mintPublic().send({
        feeLimit: 100_000_000,
        callValue: 0
      });

      console.log("Mint tx:", tx);
      alert(`Minted NFT #${tokenId}!`);
      // Refresh wallet balance and highlight
      connectWallet();
    } catch (err) {
      console.error("Mint failed:", err);
      alert("Mint failed: " + (err.message || err));
    }
  });
});
// Marketplace address for Ainft
const AINFT_MARKETPLACE = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // Replace with actual Ainft contract address

// Approve Ainft marketplace for all NFTs
async function approveMarketplace() {
  if (!window.tronWeb || !tronWeb.ready) return alert("Connect wallet first");
  try {
    const nftContract = await tronWeb.contract().at(NFT_CONTRACT);
    const tx = await nftContract.approveMarketplace(AINFT_MARKETPLACE).send({
      feeLimit: 100_000_000
    });
    alert("Marketplace approved! You can now list NFTs on Ainft.");
  } catch (err) {
    console.error("Approve failed:", err);
    alert("Failed to approve marketplace: " + (err.message || err));
  }
}

// Add button to HTML dynamically or manually
const approveBtn = document.createElement("button");
approveBtn.textContent = "Approve Ainft Marketplace";
approveBtn.addEventListener("click", approveMarketplace);
document.getElementById("wallet-info").appendChild(approveBtn);

// Mint button logic (already in your JS)
document.querySelectorAll(".mint-btn").forEach(button => {
  button.addEventListener("click", async (e) => {
    if (!window.tronWeb || !tronWeb.ready) return alert("Connect wallet first");

    const item = e.target.closest(".item");
    const tokenId = item.dataset.tokenId;
    try {
      const nftContract = await tronWeb.contract().at(NFT_CONTRACT);
      await nftContract.mintPublic().send({
        feeLimit: 200_000_000
      });
      alert(`Minted NFT #${tokenId}!`);
    } catch (err) {
      console.error("Mint failed:", err);
      alert("Mint failed: " + (err.message || err));
    }
  });
});
