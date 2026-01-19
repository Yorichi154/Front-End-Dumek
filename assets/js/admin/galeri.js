let galeriAdminData = JSON.parse(localStorage.getItem("galeri")) || [];

function renderAdminGaleri() {
  const tbody = document.getElementById("adminGaleriList");
  tbody.innerHTML = "";

  galeriAdminData.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${item.title}</td>
        <td>${item.category}</td>
        <td>${item.date}</td>
        <td>
          <button onclick="editGaleri(${index})">Edit</button>
          <button onclick="deleteGaleri(${index})">Hapus</button>
        </td>
      </tr>
    `;
  });
}

function deleteGaleri(index) {
  galeriAdminData.splice(index, 1);
  localStorage.setItem("galeri", JSON.stringify(galeriAdminData));
  renderAdminGaleri();
}

document.addEventListener("DOMContentLoaded", renderAdminGaleri);
