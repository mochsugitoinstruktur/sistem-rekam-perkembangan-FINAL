// URL WEB APP GOOGLE APPS SCRIPT (Ganti dengan URL Deploy Anda setelah setup Google Sheets)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyspVLp63A0ugobjbfaizwgjThY8rFzB3yK-u2uKl1C7mGVYr-qxE4WwJcMdjrmvQ/exec";

let dataPM = [];
let dataPegawai = [];
let dataPerkembangan = [];

// LOAD DATA DARI CLOUD SAAT PERTAMA KALI DIBUKA & SET AUTO-REFRESH SETIAP 2 DETIK
window.onload = function() {
    loadDataFromCloud(); // Muat data pertama kali saat halaman dibuka

    // Sinkronisasi otomatis / ambil data dari cloud setiap 2 detik (2000 ms)
    setInterval(() => {
        loadDataFromCloud();
    }, 2000);
};

async function loadDataFromCloud() {
    const statusEl = document.getElementById('sync-status');
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("GANTI_DENGAN")) {
        // Fallback ke sample data jika URL belum diset
        statusEl.className = "text-xs bg-rose-600 text-white px-2.5 py-1 rounded-full font-medium flex items-center gap-1";
        statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> URL Apps Script Belum Diset`;
        initDefaultData();
        return;
    }

    try {
        statusEl.className = "text-xs bg-amber-500 text-white px-2.5 py-1 rounded-full font-medium flex items-center gap-1";
        statusEl.innerHTML = `<i class="fa-solid fa-rotate animate-spin"></i> Menghubungkan Cloud...`;

        const response = await fetch(APPS_SCRIPT_URL);
        const result = await response.json();

        if (result && result.pm) {
            dataPM = result.pm;
            dataPegawai = result.pegawai || [];
            dataPerkembangan = result.perkembangan || [];
            
            statusEl.className = "text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-full font-medium flex items-center gap-1";
            statusEl.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Terhubung ke Google Sheets`;
        } else {
            initDefaultData();
        }
    } catch (error) {
        console.error("Gagal memuat data:", error);
        statusEl.className = "text-xs bg-rose-600 text-white px-2.5 py-1 rounded-full font-medium flex items-center gap-1";
        statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Gagal Sinkronisasi`;
        initDefaultData();
    }

    renderPMTable();
    renderPegawaiTable();
    renderPerkembanganTable();
}

function initDefaultData() {
    dataPM = [
        { id: 'PM001', nama: 'Ananda Rizky', ibu: 'Siti Aminah', jk: 'Laki - Laki', kasus: 'Tawuran', status: 'Titipan', peksos: 'Budi Santoso, S.Tr.Sos', masuk: '2024-01-15', terminasi: '2024-07-15', foto: '' }
    ];
    dataPegawai = [
        { id: 'PEG001', nama: 'Budi Santoso, S.Tr.Sos', nip: '198503122010011005', jabatan: 'Pekerja Sosial', pokja: 'Pokja ABH', foto: '' },
        { id: 'PEG003', nama: 'Drs. Ahmad Hidayat, M.Si', nip: '197501011999031001', jabatan: 'Ketua Pokja', pokja: 'Pokja ABH', foto: '' }
    ];
    dataPerkembangan = [
        { id: 'PER001', pmId: 'PM001', tanggal: '2024-01-20', kategori: 'Perilaku & Disiplin', deskripsi: 'PM mulai menyesuaikan diri.', rekomendasi: 'Konseling rutin.', petugas: 'Budi Santoso, S.Tr.Sos' }
    ];
}

// SIMPAN DATA KE CLOUD (GOOGLE SHEETS)
async function saveData() {
    const statusEl = document.getElementById('sync-status');
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("GANTI_DENGAN")) {
        showToast('Data disimpan lokal (URL Apps Script belum diset).');
        return;
    }

    try {
        statusEl.className = "text-xs bg-amber-500 text-white px-2.5 py-1 rounded-full font-medium flex items-center gap-1";
        statusEl.innerHTML = `<i class="fa-solid fa-rotate animate-spin"></i> Menyimpan ke Cloud...`;

        const payload = {
            pm: dataPM,
            pegawai: dataPegawai,
            perkembangan: dataPerkembangan
        };

        await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });

        statusEl.className = "text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-full font-medium flex items-center gap-1";
        statusEl.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Data Tersinkron ke Cloud`;
        showToast('Berhasil disimpan & disinkronkan ke Google Sheets!');
    } catch (error) {
        console.error("Gagal menyimpan:", error);
        statusEl.className = "text-xs bg-rose-600 text-white px-2.5 py-1 rounded-full font-medium flex items-center gap-1";
        statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Gagal Menyimpan`;
        showToast('Gagal menyinkronkan ke cloud.');
    }
}

// TOGGLE REKAP VS INDIVIDU VS FILTER REPORT
function toggleLaporanType() {
    const type = document.getElementById('select-tipe-laporan').value;
    const pmWrapper = document.getElementById('wrapper-select-pm');
    const peksosWrapper = document.getElementById('wrapper-select-peksos');
    const kasusWrapper = document.getElementById('wrapper-select-kasus');
    const secIndividu = document.getElementById('report-section-individu');
    const secRekap = document.getElementById('report-section-rekapitulasi');

    pmWrapper.classList.add('hidden');
    peksosWrapper.classList.add('hidden');
    kasusWrapper.classList.add('hidden');

    if (type === 'individu') {
        pmWrapper.classList.remove('hidden');
        secIndividu.classList.remove('hidden');
        secRekap.classList.add('hidden');
        generateReport();
    } else if (type === 'peksos') {
        peksosWrapper.classList.remove('hidden');
        secIndividu.classList.add('hidden');
        secRekap.classList.remove('hidden');
        generateFilterReport();
    } else if (type === 'kasus') {
        kasusWrapper.classList.remove('hidden');
        secIndividu.classList.add('hidden');
        secRekap.classList.remove('hidden');
        generateFilterReport();
    } else if (type === 'rekapitulasi') {
        secIndividu.classList.add('hidden');
        secRekap.classList.remove('hidden');
        generateRekapitulasiReport();
    }
}

function generateFilterReport() {
    const type = document.getElementById('select-tipe-laporan').value;
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('report-rekap-print-date').innerText = todayStr;
    document.getElementById('report-ttd-date').innerText = todayStr;

    let filteredPM = [];
    const titleEl = document.getElementById('report-rekap-title');
    const subtitleEl = document.getElementById('report-rekap-subtitle');

    if (type === 'peksos') {
        const selectedPeksos = document.getElementById('select-laporan-peksos').value;
        filteredPM = dataPM.filter(pm => pm.peksos === selectedPeksos);
        titleEl.innerText = "LAPORAN REKAPITULASI PM BERDASARKAN PEKSOS PENDAMPING";
        subtitleEl.innerText = `Pekerja Sosial: ${selectedPeksos}`;

        const peksosObj = dataPegawai.find(p => p.nama === selectedPeksos);
        document.getElementById('report-ttd-peksos-nama').innerText = selectedPeksos;
        document.getElementById('report-ttd-peksos-nip').innerText = peksosObj ? peksosObj.nip : '-';
    } else if (type === 'kasus') {
        const selectedKasus = document.getElementById('select-laporan-kasus').value;
        filteredPM = dataPM.filter(pm => pm.kasus === selectedKasus);
        titleEl.innerText = "LAPORAN REKAPITULASI PM BERDASARKAN KATEGORI KASUS";
        subtitleEl.innerText = `Kategori Kasus: ${selectedKasus}`;

        document.getElementById('report-ttd-peksos-nama').innerText = "Pekerja Sosial";
        document.getElementById('report-ttd-peksos-nip').innerText = "-";
    }

    renderFilteredTable(filteredPM);
}

function generateRekapitulasiReport() {
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('report-rekap-print-date').innerText = todayStr;
    document.getElementById('report-ttd-date').innerText = todayStr;

    document.getElementById('report-rekap-title').innerText = "LAPORAN REKAPITULASI DATABASE & REKAM PERKEMBANGAN PM";
    document.getElementById('report-rekap-subtitle').innerText = "Seluruh Data Penerima Manfaat Sentra Handayani";

    renderFilteredTable(dataPM);
}

function renderFilteredTable(listPM) {
    const tbody = document.getElementById('report-rekapitulasi-body');
    tbody.innerHTML = '';

    if (listPM.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="border border-slate-300 p-4 text-center text-slate-400 italic">Tidak ada data Penerima Manfaat.</td></tr>`;
        return;
    }

    listPM.forEach((pm, index) => {
        const pmPerkembangan = dataPerkembangan
            .filter(p => p.pmId === pm.id)
            .sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));

        // Bungkus dengan formatDate di sini
        const lastUpdate = pmPerkembangan.length > 0 ? formatDate(pmPerkembangan[0].tanggal) : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border border-slate-300 p-2 text-center font-mono">${index + 1}</td>
            <td class="border border-slate-300 p-2 font-bold">${pm.nama}<br><span class="text-slate-500 text-[10px]">Ibu: ${pm.ibu}</span></td>
            <td class="border border-slate-300 p-2">${pm.kasus}</td>
            <td class="border border-slate-300 p-2">${pm.status}</td>
            <td class="border border-slate-300 p-2">${pm.peksos}</td>
            <td class="border border-slate-300 p-2 text-center font-bold">${pmPerkembangan.length}</td>
            <td class="border border-slate-300 p-2 font-mono text-center">${lastUpdate}</td>
        `;
        tbody.appendChild(tr);
    });

    const KetuaPokjaObj = dataPegawai.find(p => p.jabatan === 'Ketua Pokja');
    if(KetuaPokjaObj) {
        document.getElementById('report-ttd-pokja-nama').innerText = KetuaPokjaObj.nama;
        document.getElementById('report-ttd-pokja-nip').innerText = KetuaPokjaObj.nip;
    } else {
        document.getElementById('report-ttd-pokja-nama').innerText = 'Tuti Nurhayati';
        document.getElementById('report-ttd-pokja-nip').innerText = '198401182010122001';
    }
}

function exportRekapitulasiPDF() {
    switchTab('laporan');
    document.getElementById('select-tipe-laporan').value = 'rekapitulasi';
    toggleLaporanType();
    setTimeout(() => { window.print(); }, 300);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('border-indigo-600', 'text-indigo-600');
        el.classList.add('border-transparent', 'text-slate-500');
    });

    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`tab-${tabName}-btn`);
    activeBtn.classList.remove('border-transparent', 'text-slate-500');
    activeBtn.classList.add('border-indigo-600', 'text-indigo-600');

    if(tabName === 'laporan') {
        populateLaporanSelect();
        toggleLaporanType();
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

function renderPMTable() {
    const tbody = document.getElementById('pm-table-body');
    const search = document.getElementById('search-pm').value.toLowerCase();
    tbody.innerHTML = '';

    const filtered = dataPM.filter(pm => 
        (pm.nama && pm.nama.toLowerCase().includes(search)) || 
        (pm.ibu && pm.ibu.toLowerCase().includes(search)) || 
        (pm.kasus && pm.kasus.toLowerCase().includes(search))
    );

    document.getElementById('total-pm-count').innerText = filtered.length;

    filtered.forEach(pm => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
        tr.innerHTML = `
            <td class="p-3">
                ${pm.foto ? `<img src="${pm.foto}" class="w-10 h-10 rounded-full object-cover border">` : `<div class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-xs font-bold">${pm.nama ? pm.nama.charAt(0) : 'P'}</div>`}
            </td>
            <td class="p-3 font-semibold text-slate-800">${pm.nama}</td>
            <td class="p-3 text-slate-600">${pm.ibu}</td>
            <td class="p-3 text-slate-600">${pm.jk}</td>
            <td class="p-3"><span class="px-2 py-1 bg-rose-50 text-rose-700 rounded-md font-medium text-xs">${pm.kasus}</span></td>
            <td class="p-3"><span class="px-2 py-1 ${pm.status === 'Putusan' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'} rounded-md font-medium text-xs">${pm.status}</span></td>
            <td class="p-3 text-slate-600">${pm.peksos}</td>
            <td class="p-3 text-slate-600">${formatDate(pm.masuk)}</td>
            <td class="p-3 text-slate-600">${pm.terminasi ? formatDate(pm.terminasi) : '-'}</td>
            <td class="p-3 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <button onclick="editPM('${pm.id}')" class="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="deletePM('${pm.id}')" class="p-1.5 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPegawaiTable() {
    const tbody = document.getElementById('pegawai-table-body');
    tbody.innerHTML = '';

    dataPegawai.forEach(peg => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
        tr.innerHTML = `
            <td class="p-3">
                ${peg.foto ? `<img src="${peg.foto}" class="w-10 h-10 rounded-full object-cover border">` : `<div class="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">${peg.nama ? peg.nama.charAt(0) : 'P'}</div>`}
            </td>
            <td class="p-3 font-semibold text-slate-800">${peg.nama}</td>
            <td class="p-3 text-slate-600 font-mono text-xs">${peg.nip}</td>
            <td class="p-3"><span class="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium">${peg.jabatan}</span></td>
            <td class="p-3 text-slate-600">${peg.pokja}</td>
            <td class="p-3 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <button onclick="editPegawai('${peg.id}')" class="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="deletePegawai('${peg.id}')" class="p-1.5 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    updateDropdownOptions();
}

function renderPerkembanganTable() {
    const tbody = document.getElementById('perkembangan-table-body');
    const filterPM = document.getElementById('filter-perkembangan-pm').value;
    tbody.innerHTML = '';

    const filtered = filterPM ? dataPerkembangan.filter(p => p.pmId === filterPM) : dataPerkembangan;

    filtered.forEach(p => {
        const pm = dataPM.find(item => item.id === p.pmId) || { nama: 'PM Terhapus' };
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
        tr.innerHTML = `
            <td class="p-3 font-mono text-xs text-slate-600">${formatDate(p.tanggal)}</td>
            <td class="p-3 font-semibold text-slate-800">${pm.nama}</td>
            <td class="p-3"><span class="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">${p.kategori}</span></td>
            <td class="p-3 text-slate-700 max-w-xs">${p.deskripsi}</td>
            <td class="p-3 text-slate-600 max-w-xs">${p.rekomendasi || '-'}</td>
            <td class="p-3 text-slate-600">${p.petugas}</td>
            <td class="p-3 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <button onclick="editPerkembangan('${p.id}')" class="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="deletePerkembangan('${p.id}')" class="p-1.5 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateDropdownOptions() {
    const peksosSelect = document.getElementById('pm-peksos');
    const filterPerkembangan = document.getElementById('filter-perkembangan-pm');
    const perkPMSelect = document.getElementById('perkembangan-pm');
    const perkPetugasSelect = document.getElementById('perkembangan-petugas');

    const peksosList = dataPegawai.filter(p => p.jabatan === 'Pekerja Sosial' || p.jabatan === 'Ketua Pokja');
    peksosSelect.innerHTML = peksosList.map(p => `<option value="${p.nama}">${p.nama}</option>`).join('');
    perkPetugasSelect.innerHTML = dataPegawai.map(p => `<option value="${p.nama}">${p.nama} (${p.jabatan})</option>`).join('');

    const pmOptions = dataPM.map(p => `<option value="${p.id}">${p.nama} - (${p.kasus})</option>`).join('');
    filterPerkembangan.innerHTML = `<option value="">-- Semua PM --</option>` + pmOptions;
    perkPMSelect.innerHTML = pmOptions;
}

function openPMModal(editId = null) {
    document.getElementById('form-pm').reset();
    document.getElementById('pm-id').value = '';
    document.getElementById('modal-pm-title').innerText = 'Tambah Data Penerima Manfaat';
    updateDropdownOptions();

    if(editId) {
        const pm = dataPM.find(p => p.id === editId);
        if(pm) {
            document.getElementById('pm-id').value = pm.id;
            document.getElementById('pm-nama').value = pm.nama;
            document.getElementById('pm-ibu').value = pm.ibu;
            document.getElementById('pm-jk').value = pm.jk;
            document.getElementById('pm-kasus').value = pm.kasus;
            document.getElementById('pm-status').value = pm.status;
            document.getElementById('pm-peksos').value = pm.peksos;
            document.getElementById('pm-masuk').value = pm.masuk;
            document.getElementById('pm-terminasi').value = pm.terminasi;
            document.getElementById('modal-pm-title').innerText = 'Edit Data Penerima Manfaat';
        }
    }
    document.getElementById('modal-pm').classList.remove('hidden');
}

function closePMModal() {
    document.getElementById('modal-pm').classList.add('hidden');
}

function savePM(e) {
    e.preventDefault();
    const id = document.getElementById('pm-id').value || 'PM' + String(Date.now()).slice(-4);
    const fotoInput = document.getElementById('pm-foto');

    const handleSave = (fotoBase64) => {
        const existingIndex = dataPM.findIndex(p => p.id === id);
        const newPM = {
            id: id,
            nama: document.getElementById('pm-nama').value.trim(),
            ibu: document.getElementById('pm-ibu').value.trim(),
            jk: document.getElementById('pm-jk').value,
            kasus: document.getElementById('pm-kasus').value,
            status: document.getElementById('pm-status').value,
            peksos: document.getElementById('pm-peksos').value,
            masuk: document.getElementById('pm-masuk').value,
            terminasi: document.getElementById('pm-terminasi').value,
            foto: fotoBase64 || (existingIndex >= 0 ? dataPM[existingIndex].foto : '')
        };

        if(existingIndex >= 0) {
            dataPM[existingIndex] = newPM;
        } else {
            dataPM.push(newPM);
        }

        saveData();
        renderPMTable();
        updateDropdownOptions();
        closePMModal();
    };

    if (fotoInput.files && fotoInput.files[0]) {
        compressImage(fotoInput.files[0], handleSave);
    } else {
        handleSave(null);
    }
}

function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 300;
            const MAX_HEIGHT = 300;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.7));
        };
    };
}

function editPM(id) { openPMModal(id); }

function deletePM(id) {
    if(confirm('Hapus data PM ini? Semua rekam perkembangan terkait juga akan terhapus.')) {
        dataPM = dataPM.filter(p => p.id !== id);
        dataPerkembangan = dataPerkembangan.filter(p => p.pmId !== id);
        saveData();
        renderPMTable();
        renderPerkembanganTable();
        updateDropdownOptions();
    }
}

function openPegawaiModal(editId = null) {
    document.getElementById('form-pegawai').reset();
    document.getElementById('pegawai-id').value = '';
    document.getElementById('modal-pegawai-title').innerText = 'Tambah Data Pegawai';

    if(editId) {
        const peg = dataPegawai.find(p => p.id === editId);
        if(peg) {
            document.getElementById('pegawai-id').value = peg.id;
            document.getElementById('pegawai-nama').value = peg.nama;
            document.getElementById('pegawai-nip').value = peg.nip;
            document.getElementById('pegawai-jabatan').value = peg.jabatan;
            document.getElementById('pegawai-pokja').value = peg.pokja;
            document.getElementById('modal-pegawai-title').innerText = 'Edit Data Pegawai';
        }
    }
    document.getElementById('modal-pegawai').classList.remove('hidden');
}

function closePegawaiModal() { document.getElementById('modal-pegawai').classList.add('hidden'); }

function savePegawai(e) {
    e.preventDefault();
    const id = document.getElementById('pegawai-id').value || 'PEG' + String(Date.now()).slice(-4);
    const fotoInput = document.getElementById('pegawai-foto');

    const handleSave = (fotoBase64) => {
        const existingIndex = dataPegawai.findIndex(p => p.id === id);
        const newPegawai = {
            id: id,
            nama: document.getElementById('pegawai-nama').value,
            nip: document.getElementById('pegawai-nip').value,
            jabatan: document.getElementById('pegawai-jabatan').value,
            pokja: document.getElementById('pegawai-pokja').value,
            foto: fotoBase64 || (existingIndex >= 0 ? dataPegawai[existingIndex].foto : '')
        };

        if(existingIndex >= 0) {
            dataPegawai[existingIndex] = newPegawai;
        } else {
            dataPegawai.push(newPegawai);
        }

        saveData();
        renderPegawaiTable();
        closePegawaiModal();
    };

    if (fotoInput.files && fotoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) { handleSave(evt.target.result); };
        reader.readAsDataURL(fotoInput.files[0]);
    } else {
        handleSave(null);
    }
}

function editPegawai(id) { openPegawaiModal(id); }

function deletePegawai(id) {
    if(confirm('Hapus pegawai ini?')) {
        dataPegawai = dataPegawai.filter(p => p.id !== id);
        saveData();
        renderPegawaiTable();
    }
}

function openPerkembanganModal(editId = null) {
    document.getElementById('form-perkembangan').reset();
    document.getElementById('perkembangan-id').value = '';
    document.getElementById('modal-perkembangan-title').innerText = 'Catat Rekam Perkembangan';

    if(editId) {
        const perk = dataPerkembangan.find(p => p.id === editId);
        if(perk) {
            document.getElementById('perkembangan-id').value = perk.id;
            document.getElementById('perkembangan-pm').value = perk.pmId;
            document.getElementById('perkembangan-tanggal').value = perk.tanggal;
            document.getElementById('perkembangan-kategori').value = perk.kategori;
            document.getElementById('perkembangan-deskripsi').value = perk.deskripsi;
            document.getElementById('perkembangan-rekomendasi').value = perk.rekomendasi;
            document.getElementById('perkembangan-petugas').value = perk.petugas;
            document.getElementById('modal-perkembangan-title').innerText = 'Edit Rekam Perkembangan';
        }
    } else {
        document.getElementById('perkembangan-tanggal').value = new Date().toISOString().split('T')[0];
    }
    document.getElementById('modal-perkembangan').classList.remove('hidden');
}

function closePerkembanganModal() { document.getElementById('modal-perkembangan').classList.add('hidden'); }

function savePerkembangan(e) {
    e.preventDefault();
    const id = document.getElementById('perkembangan-id').value || 'PER' + String(Date.now()).slice(-4);
    const fotoInput = document.getElementById('perkembangan-foto');

    const handleSave = (fotoBase64) => {
        const existingIndex = dataPerkembangan.findIndex(p => p.id === id);
        const newRecord = {
            id: id,
            pmId: document.getElementById('perkembangan-pm').value,
            tanggal: document.getElementById('perkembangan-tanggal').value,
            kategori: document.getElementById('perkembangan-kategori').value,
            deskripsi: document.getElementById('perkembangan-deskripsi').value,
            rekomendasi: document.getElementById('perkembangan-rekomendasi').value,
            petugas: document.getElementById('perkembangan-petugas').value,
            foto: fotoBase64 || (existingIndex >= 0 ? dataPerkembangan[existingIndex].foto : '')
        };

        if(existingIndex >= 0) {
            dataPerkembangan[existingIndex] = newRecord;
        } else {
            dataPerkembangan.push(newRecord);
        }

        saveData();
        renderPerkembanganTable();
        closePerkembanganModal();
    };

    if (fotoInput.files && fotoInput.files[0]) {
        compressImage(fotoInput.files[0], handleSave);
    } else {
        handleSave(null);
    }
}

function editPerkembangan(id) { openPerkembanganModal(id); }

function deletePerkembangan(id) {
    if(confirm('Hapus catatan perkembangan ini?')) {
        dataPerkembangan = dataPerkembangan.filter(p => p.id !== id);
        saveData();
        renderPerkembanganTable();
    }
}

function populateLaporanSelect() {
    const selectPM = document.getElementById('select-laporan-pm');
    selectPM.innerHTML = dataPM.map(pm => `<option value="${pm.id}">${pm.nama} (${pm.kasus})</option>`).join('');

    const selectPeksos = document.getElementById('select-laporan-peksos');
    const peksosList = dataPegawai.filter(p => p.jabatan === 'Pekerja Sosial' || p.jabatan === 'Ketua Pokja');
    selectPeksos.innerHTML = peksosList.map(p => `<option value="${p.nama}">${p.nama}</option>`).join('');
}

function generateReport() {
    const pmId = document.getElementById('select-laporan-pm').value;
    const pm = dataPM.find(p => p.id === pmId);
    if(!pm) return;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('report-print-date').innerText = todayStr;
    document.getElementById('report-ttd-date').innerText = todayStr;

    document.getElementById('report-pm-nama').innerText = pm.nama;
    document.getElementById('report-pm-ibu').innerText = pm.ibu;
    document.getElementById('report-pm-jk').innerText = pm.jk;
    document.getElementById('report-pm-kasus').innerText = pm.kasus;
    document.getElementById('report-pm-status').innerText = pm.status;
    document.getElementById('report-pm-peksos').innerText = pm.peksos;
    document.getElementById('report-pm-masuk').innerText = formatDate(pm.masuk);
    document.getElementById('report-pm-terminasi').innerText = pm.terminasi ? formatDate(pm.terminasi) : 'Belum Ditentukan';

    const imgEl = document.getElementById('report-pm-photo');
    const iconEl = document.getElementById('report-pm-photo-icon');
    if(pm.foto) {
        imgEl.src = pm.foto;
        imgEl.classList.remove('hidden');
        iconEl.classList.add('hidden');
    } else {
        imgEl.classList.add('hidden');
        iconEl.classList.remove('hidden');
    }

    const peksosObj = dataPegawai.find(p => p.nama === pm.peksos);
    document.getElementById('report-ttd-peksos-nama').innerText = pm.peksos || 'Pekerja Sosial';
    document.getElementById('report-ttd-peksos-nip').innerText = peksosObj ? peksosObj.nip : '-';

    const KetuaPokjaObj = dataPegawai.find(p => p.jabatan === 'Ketua Pokja');
    if(KetuaPokjaObj) {
        document.getElementById('report-ttd-pokja-nama').innerText = KetuaPokjaObj.nama;
        document.getElementById('report-ttd-pokja-nip').innerText = KetuaPokjaObj.nip;
    } else {
        document.getElementById('report-ttd-pokja-nama').innerText = 'Tuti Nurhayati';
        document.getElementById('report-ttd-pokja-nip').innerText = '198401182010122001';
    }

    const pmPerkembangan = dataPerkembangan
        .filter(p => p.pmId === pmId)
        .sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));

    const reportTbody = document.getElementById('report-perkembangan-body');
    reportTbody.innerHTML = '';

    if(pmPerkembangan.length === 0) {
        reportTbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">Belum ada catatan rekam perkembangan.</td></tr>`;
    } else {
        pmPerkembangan.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="border border-slate-300 p-2 font-mono align-top">${formatDate(p.tanggal)}</td>
        <td class="border border-slate-300 p-2 font-semibold align-top">${p.kategori}</td>
        <td class="border border-slate-300 p-2 align-top">
            <p>${p.deskripsi}</p>
            ${p.rekomendasi ? `<p class="mt-1 text-slate-600 italic"><strong>Rekomendasi:</strong> ${p.rekomendasi}</p>` : ''}
            ${p.foto ? `<div class="mt-2"><img src="${p.foto}" alt="Foto Perkembangan" class="w-28 h-20 object-cover rounded border shadow-sm"></div>` : ''}
        </td>
        <td class="border border-slate-300 p-2 align-top">${p.petugas}</td>
    `;
    reportTbody.appendChild(tr);
});
    }
}

function exportAllToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "--- DATA PENERIMA MANFAAT ---\n";
    csvContent += "ID,Nama,Nama Ibu Kandung,Jenis Kelamin,Kasus,Status,Peksos,Tanggal Masuk,Tanggal Terminasi\n";
    dataPM.forEach(p => {
        csvContent += `"${p.id}","${p.nama}","${p.ibu}","${p.jk}","${p.kasus}","${p.status}","${p.peksos}","${p.masuk}","${p.terminasi}"\n`;
    });

    csvContent += "\n--- DATA REKAM PERKEMBANGAN ---\n";
    csvContent += "ID Catatan,ID PM,Tanggal,Kategori,Deskripsi,Rekomendasi,Petugas\n";
    dataPerkembangan.forEach(r => {
        csvContent += `"${r.id}","${r.pmId}","${r.tanggal}","${r.kategori}","${r.deskripsi.replace(/"/g, '""')}","${r.rekomendasi.replace(/"/g, '""')}","${r.petugas}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekam_Perkembangan_Sentra_Handayani_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Database berhasil diekspor ke format Excel CSV!');
}

function formatDate(dateString) {
    if (!dateString) return '-';
    
    // Membuat objek Date dari string data (mendukung format ISO / UTC / YYYY-MM-DD HH:mm)
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString; // Fallback jika format tidak valid

    const day = String(dateObj.getDate()).padStart(2, '0');
    const monthNames = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const month = monthNames[dateObj.getMonth() + 1];
    const year = dateObj.getFullYear();

    // Mengambil Jam dan Menit
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    // Jika ingin menampilkan tanggal beserta jam (contoh: 02 November 2026, 15:30)
    return `${day} ${month} ${year}, ${hours}:${minutes}`; 
    // Atau jika hanya ingin format tanggal & jam tanpa teks zona waktu:
    // return `${day} ${month} ${year} - ${hours}:${minutes}`;
}
