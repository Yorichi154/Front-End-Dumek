const data = JSON.parse(localStorage.getItem("berita")) || [];
const container = document.getElementById("beritaContainer");

data.forEach(b => {
  container.innerHTML += `
    <article>
      <h3>${b.judul}</h3>
      <small>${b.kategori} • ${b.tanggal}</small>
      <p>${b.isi}</p>
    </article>
  `;
});
