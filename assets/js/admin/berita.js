const form = document.getElementById("formBerita");
const list = document.getElementById("listBerita");

let berita = JSON.parse(localStorage.getItem("berita")) || [];

function render() {
  list.innerHTML = "";
  berita.forEach((b, i) => {
    list.innerHTML += `
      <li>
        <strong>${b.judul}</strong> (${b.kategori})
        <button onclick="hapus(${i})">Hapus</button>
      </li>`;
  });
}
render();

form.addEventListener("submit", e => {
  e.preventDefault();
  berita.push({
    judul: form.judul.value,
    isi: form.isi.value,
    kategori: form.kategori.value,
    tanggal: new Date().toLocaleDateString()
  });
  localStorage.setItem("berita", JSON.stringify(berita));
  form.reset();
  render();
});

function hapus(i) {
  berita.splice(i, 1);
  localStorage.setItem("berita", JSON.stringify(berita));
  render();
}
