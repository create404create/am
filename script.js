const tcpaApi = "https://api.uspeoplesearch.net/tcpa/v1?x=";
const personApi = "https://api.uspeoplesearch.net/person/v3?x=";
const premiumLookupApi = "https://premium_lookup-1-h4761841.deta.app/person?x=";

const phoneInput = document.getElementById("phoneInput");
const lookupBtn = document.getElementById("lookupBtn");
const results = document.getElementById("results");
const recentList = document.getElementById("recentList");
const darkModeToggle = document.getElementById("darkModeToggle");
const copyBtn = document.getElementById("copyBtn");
const shareBtn = document.getElementById("shareBtn");

const fields = ["phone", "state", "dnc_national", "dnc_state", "litigator", "blacklist", "name", "address", "city", "person_state", "zip", "age"];

function setText(id, value) {
  document.getElementById(id).textContent = value || "N/A";
}

function saveToRecent(phone) {
  let recents = JSON.parse(localStorage.getItem("recentPhones") || "[]");
  recents = recents.filter(p => p !== phone);
  recents.unshift(phone);
  if (recents.length > 5) recents = recents.slice(0, 5);
  localStorage.setItem("recentPhones", JSON.stringify(recents));
  renderRecent();
}

function renderRecent() {
  let recents = JSON.parse(localStorage.getItem("recentPhones") || "[]");
  recentList.innerHTML = "";
  recents.forEach(phone => {
    const li = document.createElement("li");
    li.textContent = phone;
    li.onclick = () => {
      phoneInput.value = phone;
      lookupPhone(phone);
    };
    recentList.appendChild(li);
  });
}

async function lookupPhone(phone) {
  if (!phone) return;
  try {
    results.classList.add("hidden");

    // Safe API calls with fallback if premium fails
    let tcpaRes = {}, personRes = {}, premiumRes = {};
    [tcpaRes, personRes] = await Promise.all([
      fetch(tcpaApi + phone).then(r => r.json()),
      fetch(personApi + phone).then(r => r.json())
    ]);
    try {
      premiumRes = await fetch(premiumLookupApi + phone).then(r => r.json());
    } catch (e) {
      console.warn("Premium API failed:", e.message);
    }

    setText("phone", phone);
    setText("state", tcpaRes.state);
    setText("dnc_national", tcpaRes.dnc_national ? "Yes" : "No");
    setText("dnc_state", tcpaRes.dnc_state ? "Yes" : "No");
    setText("litigator", tcpaRes.litigator ? "Yes" : "No");
    setText("blacklist", tcpaRes.blacklist ? "Yes" : "No");

    setText("name", premiumRes.name || personRes.name);
    setText("address", premiumRes.address || personRes.address);
    setText("city", premiumRes.city || personRes.city);
    setText("person_state", premiumRes.state || personRes.state);
    setText("zip", premiumRes.zip || personRes.zip);
    setText("age", premiumRes.age || personRes.age);

    results.classList.remove("hidden");
    saveToRecent(phone);
  } catch (err) {
    alert("Something went wrong. Check console.");
    console.error(err);
  }
}

lookupBtn.onclick = () => lookupPhone(phoneInput.value.trim());

copyBtn.onclick = () => {
  let output = fields.map(f => `${f.replace("_", " ").toUpperCase()}: ${document.getElementById(f).textContent}`).join("\n");
  navigator.clipboard.writeText(output).then(() => alert("Copied to clipboard!"));
};

shareBtn.onclick = () => {
  if (navigator.share) {
    navigator.share({
      title: "Phone Lookup Result",
      text: document.getElementById("phone").textContent,
      url: window.location.href
    });
  } else {
    alert("Sharing not supported in this browser.");
  }
};

darkModeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "true" : "false");
};

window.onload = () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
  renderRecent();
};
