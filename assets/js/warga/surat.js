const form = document.getElementById("formSurat");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem("user"));

  const data = {
    nama: user.nama,
    nik: user.nik,
    rt: user.rt,
    rw: user.rw,
    jenis: form.jenis.value,
    keperluan: form.keperluan.value,
    keterangan: form.keterangan.value,
    status: "menunggu",
    tanggal: new Date().toISOString()
  };

  const surat = JSON.parse(localStorage.getItem("surat")) || [];
  surat.push(data);
  localStorage.setItem("surat", JSON.stringify(surat));

  alert("Pengajuan surat berhasil!");
  form.reset();
});
