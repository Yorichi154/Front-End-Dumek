const form = document.getElementById("formPengaduan");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem("user"));

  const data = {
    nama: user.nama,
    rt: user.rt,
    rw: user.rw,
    judul: form.judul.value,
    lokasi: form.lokasi.value,
    isi: form.isi.value,
    status: "baru",
    tanggal: new Date().toISOString()
  };

  const pengaduan = JSON.parse(localStorage.getItem("pengaduan")) || [];
  pengaduan.push(data);
  localStorage.setItem("pengaduan", JSON.stringify(pengaduan));

  alert("Pengaduan berhasil dikirim!");
  form.reset();
});
