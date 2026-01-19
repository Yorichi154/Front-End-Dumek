const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "warga") {
  window.location.href = "#login";
}

// Isi data warga
document.getElementById("namaWarga").innerText = user.nama;
document.getElementById("namaHeader").innerText = user.nama;
document.getElementById("rtRw").innerText = `RT ${user.rt} / RW ${user.rw}`;

function logoutWarga() {
  localStorage.removeItem("user");
  window.location.href = "#home";
}
