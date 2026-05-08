document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    
    // 1. Qat'iy xavfsizlik: Token bo'lmasa darhol haydash
    if (!token) {
        window.location.href = '/auth.html';
        return;
    }

    let currentUser = null;

    // === VILOYAT VA TUMANLAR BAZASI ===
    const regionsData = {
        "Andijon": ["Andijon shahri", "Asaka", "Baliqchi", "Bo'z", "Buloqboshi", "Izboskan", "Jalaquduq", "Marhamat", "Oltinko'l", "Paxtaobod", "Qo'rg'ontepa", "Shahrixon", "Ulug'nor", "Xo'jaobod"],
        "Buxoro": ["Buxoro shahri", "Kogon shahri", "Olot", "Buxoro tuman", "G'ijduvon", "Jondor", "Kogon tuman", "Qorako'l", "Qorovulbozor", "Peshku", "Romitan", "Shofirkon", "Vobkent"],
        "Farg'ona": ["Farg'ona shahri", "Marg'ilon", "Qo'qon", "Beshariq", "Bog'dod", "Buvayda", "Dang'ara", "Farg'ona tuman", "Furqat", "Oltiariq", "Qo'shtepa", "Quva", "Rishton", "So'x", "Toshloq", "Uchko'prik", "Yozyovon"],
        "Jizzax": ["Jizzax shahri", "Arnasoy", "Baxmal", "Do'stlik", "Forish", "G'allaorol", "Sharof Rashidov", "Mirzacho'l", "Paxtakor", "Yangiobod", "Zomin", "Zafarobod", "Zarbdor"],
        "Xorazm": ["Urganch shahri", "Xiva shahri", "Bog'ot", "Gurlan", "Qo'shko'pir", "Shovot", "Urganch tuman", "Xazorasp", "Xiva tuman", "Yangiariq", "Yangibozor"],
        "Namangan": ["Namangan shahri", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq", "Namangan tuman", "Norin", "Pop", "To'raqo'rg'on", "Uchqo'rg'on", "Uychi", "Yangiqo'rg'on"],
        "Navoiy": ["Navoiy shahri", "Zarafshon shahri", "Karmana", "Konimex", "Navbahor", "Nurota", "Qiziltepa", "Tomdi", "Uchquduq", "Xatirchi"],
        "Qashqadaryo": ["Qarshi shahri", "Shahrisabz shahri", "Chiroqchi", "Dehqonobod", "G'uzor", "Kasbi", "Kitob", "Koson", "Mirishkor", "Muborak", "Nishon", "Qamashi", "Qarshi tuman", "Shahrisabz tuman", "Yakkabog'"],
        "Qoraqalpog'iston Respublikasi": ["Nukus shahri", "Amudaryo", "Beruniy", "Chimboy", "Ellikqal'a", "Kegeyli", "Mo'ynoq", "Nukus tuman", "Qanliko'l", "Qo'ng'irot", "Qorao'zak", "Shumanay", "Taxtako'pir", "To'rtko'l", "Xo'jayli"],
        "Samarqand": ["Samarqand shahri", "Kattaqo'rg'on shahri", "Bulung'ur", "Ishtixon", "Jomboy", "Kattaqo'rg'on tuman", "Narpay", "Nurobod", "Oqdaryo", "Paxtachi", "Payariq", "Pastdarg'om", "Qo'shrabot", "Samarqand tuman", "Toyloq", "Urgut"],
        "Sirdaryo": ["Guliston shahri", "Shirin shahri", "Yangiyer shahri", "Boyovut", "Guliston tuman", "Oqoltin", "Sardoba", "Sayxunobod", "Sirdaryo tuman", "Xavos"],
        "Surxondaryo": ["Termiz shahri", "Angor", "Boysun", "Denov", "Jarqo'rg'on", "Karki", "Qiziriq", "Qumqo'rg'on", "Muzrabot", "Oltinsoy", "Sariosiyo", "Sherobod", "Sho'rchi", "Termiz tuman", "Uzun"],
        "Toshkent viloyati": ["Nurafshon shahri", "Olmaliq shahri", "Angren shahri", "Bekobod shahri", "Chirchiq shahri", "Oqqo'rg'on", "Ohangaron", "Bekobod tuman", "Bo'stonliq", "Buka", "Chinoz", "Qibray", "Quyi Chirchiq", "O'rta Chirchiq", "Parkent", "Piskent", "Toshkent tuman", "Yangiyo'l", "Yuqori Chirchiq", "Zangiota"],
        "Toshkent shahri": ["Bektemir", "Chilonzor", "Mirzo Ulug'bek", "Mirobod", "Olmazor", "Sergeli", "Shayxontohur", "Uchtepa", "Yakkasaroy", "Yashnobod", "Yunusobod"]
    };

    const editRegion = document.getElementById('editRegion');
    const editDistrict = document.getElementById('editDistrict');

    // Viloyatlarni Selectga yuklash
    Object.keys(regionsData).forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        editRegion.appendChild(option);
    });

    // Viloyat o'zgarganda tumanlarni yangilash
    editRegion.addEventListener('change', function() {
        const selectedRegion = this.value;
        editDistrict.innerHTML = '<option value="">Tanlang...</option>';
        if (selectedRegion && regionsData[selectedRegion]) {
            regionsData[selectedRegion].forEach(district => {
                const option = document.createElement('option');
                option.value = district;
                option.textContent = district;
                editDistrict.appendChild(option);
            });
        }
    });

    // 2. PROFIL MA'LUMOTLARINI YUKLASH
    async function loadProfile() {
        try {
            const res = await fetch(`${API_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (!data.success) throw new Error();
            
            currentUser = data.data;

            // Admin tugmasini ko'rsatish
            if(currentUser.role === 'admin') {
                const adminBtn = document.getElementById('adminPanelBtn');
                if(adminBtn) adminBtn.classList.remove('hidden');
            }

            document.getElementById('pInitials').textContent = `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();
            document.getElementById('pName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
            document.getElementById('pInfo').innerHTML = `
                <span class="bg-darkBg px-3 py-1.5 rounded-lg border border-darkBorder"><i class="fa-solid fa-phone text-primary mr-1"></i> ${currentUser.phoneNumber}</span> 
                <span class="bg-darkBg px-3 py-1.5 rounded-lg border border-darkBorder"><i class="fa-solid fa-location-dot text-primary mr-1"></i> ${currentUser.region}, ${currentUser.district}</span>
            `;

            fetchBooks();
            
        } catch (error) { 
            console.error(error);
            window.location.href = '/auth.html'; 
        }
    }

    loadProfile();

    // === TABLARNI BOSHQARISH ===
    const tabBooks = document.getElementById('tabBooks');
    const tabFollowing = document.getElementById('tabFollowing');
    const tabFollowers = document.getElementById('tabFollowers');
    const contentBooks = document.getElementById('contentBooks');
    const contentNetwork = document.getElementById('contentNetwork');

    const setActiveTab = (activeEl) => {
        [tabBooks, tabFollowing, tabFollowers].forEach(t => {
            t.className = "pb-4 text-xl font-black text-grayText border-b-2 border-transparent transition-colors focus:outline-none";
        });
        activeEl.className = "pb-4 text-xl font-black text-primary border-b-2 border-primary transition-colors focus:outline-none";
    };

    tabBooks.onclick = () => {
        setActiveTab(tabBooks);
        contentBooks.classList.remove('hidden');
        contentNetwork.classList.add('hidden');
        fetchBooks();
    };

    tabFollowing.onclick = () => {
        setActiveTab(tabFollowing);
        contentBooks.classList.add('hidden');
        contentNetwork.classList.remove('hidden');
        fetchNetwork('following');
    };

    tabFollowers.onclick = () => {
        setActiveTab(tabFollowers);
        contentBooks.classList.add('hidden');
        contentNetwork.classList.remove('hidden');
        fetchNetwork('followers');
    };

    async function fetchBooks() {
        try {
            const booksRes = await fetch(`${API_URL}/books/seller/${currentUser._id}`);
            const booksData = await booksRes.json();
            renderMyBooks(booksData.data || []);
        } catch (e) { console.error(e); }
    }

    async function fetchNetwork(type) {
        try {
            contentNetwork.innerHTML = '<div class="col-span-full text-center py-10"><i class="fa-solid fa-spinner fa-spin text-3xl text-primary"></i></div>';
            const res = await fetch(`${API_URL}/users/me/network?type=${type}`, { 
                headers: {'Authorization': `Bearer ${token}`} 
            });
            const data = await res.json();
            renderNetwork(data.data || [], type);
        } catch (e) { console.error(e); }
    }

    function renderNetwork(users, type) {
        if(users.length === 0) {
            contentNetwork.innerHTML = `<div class="col-span-full text-center text-grayText py-12 font-bold bg-darkCard border border-darkBorder rounded-3xl">Sizda hali ${type === 'following' ? 'obunalar' : 'obunachilar'} yo'q.</div>`;
            return;
        }

        contentNetwork.innerHTML = users.map(user => `
            <div class="bg-darkCard p-6 rounded-2xl border border-darkBorder flex items-center justify-between group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-black">
                        ${user.firstName[0]}${user.lastName[0]}
                    </div>
                    <div>
                        <div class="font-bold text-lightText">${user.firstName} ${user.lastName}</div>
                        <div class="text-xs text-grayText">${user.region}, ${user.district}</div>
                    </div>
                </div>
                ${type === 'following' ? `
                    <button onclick="unfollowFromProfile('${user._id}')" class="text-red-500 hover:bg-red-500/10 p-2.5 rounded-xl transition-all" title="Obunani bekor qilish">
                        <i class="fa-solid fa-user-minus"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    window.unfollowFromProfile = async (id) => {
        if(!confirm("Obunani bekor qilmoqchimisiz?")) return;
        await fetch(`${API_URL}/users/${id}/follow`, { 
            method: 'POST', headers: {'Authorization': `Bearer ${token}`} 
        });
        fetchNetwork('following');
    };

    function renderMyBooks(books) {
        const container = document.getElementById('myBooksContainer');
        if(books.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-grayText py-12 bg-darkCard border border-darkBorder rounded-3xl font-bold">Sizda hali e\'lonlar yo\'q.</div>';
            return;
        }

        container.innerHTML = books.map(book => {
            const imgUrl = book.images && book.images.length > 0 ? `/uploads/${book.images[0]}` : '/uploads/default.jpg';
            const price = new Intl.NumberFormat('uz-UZ').format(book.price || 0);
            return `
                <div class="bg-darkCard rounded-2xl shadow-lg border border-darkBorder flex flex-col overflow-hidden relative group isolate transform-gpu">
                    <img src="${imgUrl}" class="w-full h-52 object-cover opacity-90 group-hover:opacity-100 transition-opacity">
                    <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-10px] group-hover:translate-y-0">
                        <button onclick="openEditBook('${book._id}')" class="w-10 h-10 bg-primary text-darkBg rounded-full flex items-center justify-center hover:bg-primaryHover shadow-lg"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="deleteBook('${book._id}')" class="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <div class="p-5 flex-grow flex flex-col">
                        <div class="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">${book.genre}</div>
                        <h3 class="text-lg font-black text-lightText mb-1 truncate">${book.title}</h3>
                        <div class="text-xl font-black text-primary mb-4">${price} <span class="text-xs text-grayText">so'm</span></div>
                        <button onclick="window.location.href='/book-details.html?id=${book._id}'" class="mt-auto w-full bg-darkBg border border-darkBorder py-2.5 rounded-xl text-sm font-bold hover:text-primary hover:border-primary transition-all">E'lonni ko'rish</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // === PROFILNI TAHRIRLASH (LOGIN/PAROL BILAN) ===
    const editModal = document.getElementById('editModal');
    
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        document.getElementById('editFirstName').value = currentUser.firstName;
        document.getElementById('editLastName').value = currentUser.lastName;
        document.getElementById('oldPhone').value = currentUser.phoneNumber.replace('+998', '');
        document.getElementById('newPhone').value = '';
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';

        editRegion.value = currentUser.region;
        editRegion.dispatchEvent(new Event('change'));
        setTimeout(() => { editDistrict.value = currentUser.district; }, 100);

        editModal.classList.remove('hidden');
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => editModal.classList.add('hidden'));

    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPhone = document.getElementById('newPhone').value.trim();
        const oldPass = document.getElementById('oldPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmNewPassword').value;

        if (newPass && newPass !== confirmPass) {
            alert("Yangi parollar mos kelmadi!");
            return;
        }

        const updatedData = {
            firstName: document.getElementById('editFirstName').value.trim(),
            lastName: document.getElementById('editLastName').value.trim(),
            region: editRegion.value,
            district: editDistrict.value
        };

        if (newPhone || newPass) {
            if (!oldPass) {
                alert("Login yoki parolni o'zgartirish uchun joriy parolingizni kiriting!");
                return;
            }
            updatedData.oldPassword = oldPass;
            if(newPhone) {
                updatedData.oldPhoneNumber = currentUser.phoneNumber;
                updatedData.newPhoneNumber = `+998${newPhone}`;
            }
            if(newPass) updatedData.newPassword = newPass;
        }

        try {
            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updatedData)
            });
            const data = await res.json();
            
            if(data.success) {
                alert("Ma'lumotlar yangilandi!");
                if(newPhone) {
                    localStorage.removeItem('token');
                    window.location.href = '/auth.html';
                } else {
                    window.location.reload();
                }
            } else {
                alert(data.message || "Xatolik!");
            }
        } catch(e) { alert("Server xatosi!"); }
    });

    // === E'LONNI O'CHIRISH MANTIG'I ===
    window.deleteBook = async function(id) {
        if(!confirm("Haqiqatan ham bu e'lonni butunlay o'chirib tashlamoqchimisiz?")) return;
        try {
            const res = await fetch(`${API_URL}/books/${id}`, { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            const data = await res.json();
            if(data.success) {
                fetchBooks();
            } else {
                alert(data.message);
            }
        } catch(e) { alert("Xatolik yuz berdi!"); }
    };

    // === E'LONNI TAHRIRLASH MODALI MANTIG'I ===
    const bookModal = document.getElementById('editBookModal');
    
    window.openEditBook = async function(id) {
        try {
            const res = await fetch(`${API_URL}/books/${id}`).then(r => r.json());
            if(res.success) {
                const b = res.data;
                document.getElementById('editBookId').value = b._id;
                document.getElementById('ebTitle').value = b.title;
                document.getElementById('ebAuthor').value = b.author;
                document.getElementById('ebPrice').value = b.price;
                document.getElementById('ebPages').value = b.pages;
                document.getElementById('ebPaper').value = b.paperType;
                document.getElementById('ebWidth').value = b.dimensions.width;
                document.getElementById('ebHeight').value = b.dimensions.height;
                
                bookModal.classList.remove('hidden');
            }
        } catch(e) { alert("Ma'lumotlarni yuklashda xato!"); }
    };

    document.getElementById('closeBookModalBtn').onclick = () => bookModal.classList.add('hidden');

    document.getElementById('editBookForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('editBookId').value;
        const saveBtn = document.getElementById('saveBookBtn');
        
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Saqlanmoqda...';
        saveBtn.disabled = true;

        const updatedBookData = {
            title: document.getElementById('ebTitle').value.trim(),
            author: document.getElementById('ebAuthor').value.trim(),
            price: document.getElementById('ebPrice').value,
            pages: document.getElementById('ebPages').value,
            paperType: document.getElementById('ebPaper').value,
            width: document.getElementById('ebWidth').value,
            height: document.getElementById('ebHeight').value
        };

        try {
            const res = await fetch(`${API_URL}/books/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updatedBookData)
            });
            const result = await res.json();
            if(result.success) {
                bookModal.classList.add('hidden');
                fetchBooks();
                alert("E'lon yangilandi!");
            } else {
                alert(result.message);
            }
        } catch(e) {
            alert("Xatolik!");
        } finally {
            saveBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Saqlash';
            saveBtn.disabled = false;
        }
    };
});