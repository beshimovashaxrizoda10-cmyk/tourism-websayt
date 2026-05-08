document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost:5000/api';
    const sellerHeader = document.getElementById('sellerHeader');
    const sellerBooksContainer = document.getElementById('sellerBooksContainer');
    const token = localStorage.getItem('token');
    
    const urlParams = new URLSearchParams(window.location.search);
    const sellerId = urlParams.get('id');

    if (!sellerId) return;

    // --- LAYK BOSISH FUNKSIYASI (Sotuvchi sahifasidagi kartalar uchun ham kerak) ---
    window.toggleLikeOnCard = async function(event, bookId) {
        event.stopPropagation(); 
        if (!token) { alert("Layk bosish uchun tizimga kiring!"); return; }
        
        const heartIcon = document.getElementById(`heart-${bookId}`);
        const countSpan = document.getElementById(`likeCount-${bookId}`);
        
        try {
            const res = await fetch(`${API_URL}/books/${bookId}/like`, { 
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` } 
            });
            const data = await res.json();
            
            if(data.success) {
                let currentCount = parseInt(countSpan.innerText);
                if (heartIcon.classList.contains('text-gray-500')) {
                    heartIcon.classList.replace('text-gray-500', 'text-red-500');
                    heartIcon.classList.replace('fa-regular', 'fa-solid');
                    countSpan.innerText = currentCount + 1;
                } else {
                    heartIcon.classList.replace('text-red-500', 'text-gray-500');
                    heartIcon.classList.replace('fa-solid', 'fa-regular');
                    countSpan.innerText = currentCount - 1;
                }
            }
        } catch(e) { console.error(e); }
    };

    try {
        // Profil ma'lumotlari va e'lonlarni birgalikda tortib kelish
        const [userRes, booksRes] = await Promise.all([
            fetch(`${API_URL}/users/${sellerId}`),
            fetch(`${API_URL}/books/seller/${sellerId}`)
        ]);
        
        const userData = await userRes.json();
        const booksData = await booksRes.json();

        let isFollowing = false;
        if (token) {
            const followRes = await fetch(`${API_URL}/users/${sellerId}/check-follow`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const followData = await followRes.json();
            isFollowing = followData.isFollowing;
        }

        if (userData.success) {
            renderSellerHeader(userData.data, isFollowing);
            renderSellerBooks(booksData.data || []); 
        }
    } catch (error) { console.error(error); }

    function renderSellerHeader(seller, isFollowing) {
        const initials = `${seller.firstName.charAt(0)}${seller.lastName.charAt(0)}`.toUpperCase();
        
        sellerHeader.innerHTML = `
            <div class="flex flex-col md:flex-row items-center justify-between w-full gap-6 bg-darkCard p-8 rounded-2xl border border-darkBorder shadow-xl relative overflow-hidden">
                <div class="flex flex-col md:flex-row items-center gap-6 z-10">
                    <div class="w-24 h-24 bg-primary/20 text-primary border-2 border-primary rounded-full flex items-center justify-center font-bold text-4xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        ${initials}
                    </div>
                    <div class="text-center md:text-left">
                        <h2 class="text-3xl font-black text-lightText">${seller.firstName} ${seller.lastName}</h2>
                        <p class="text-grayText mt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 font-medium">
                            <span><i class="fa-solid fa-location-dot text-primary mr-1"></i> ${seller.region}, ${seller.district}</span>
                            <span><i class="fa-solid fa-phone text-primary mr-1"></i> ${seller.phoneNumber || "Raqam yashirilgan"}</span>
                        </p>
                    </div>
                </div>

                <div class="flex gap-6 text-center bg-darkBg px-6 py-4 rounded-xl border border-darkBorder z-10">
                    <div><span class="block text-2xl font-black text-lightText">${seller.totalBooks}</span><span class="text-xs text-primary uppercase font-bold">E'lonlar</span></div>
                    <div><span id="followersDisplay" class="block text-2xl font-black text-lightText">${seller.followersCount}</span><span class="text-xs text-primary uppercase font-bold">Mijozlar</span></div>
                    <div><span class="block text-2xl font-black text-lightText">${seller.totalLikesReceived}</span><span class="text-xs text-primary uppercase font-bold">Layklar</span></div>
                </div>

                <button id="followBtn" class="px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg flex items-center gap-2 z-10">
                    <!-- Tugma holati JS orqali chiziladi -->
                </button>
                
                <!-- Orqa fondagi yorug'lik effekti -->
                <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary opacity-5 rounded-full blur-3xl"></div>
            </div>
        `;

        const followBtn = document.getElementById('followBtn');
        const followersDisplay = document.getElementById('followersDisplay');
        
        // Tugma UI ni o'zgartirish funksiyasi
        const updateBtnUI = (following) => {
            if (following) {
                followBtn.className = "px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg flex items-center gap-2 bg-darkBorder text-lightText hover:bg-gray-600 border border-gray-500 z-10";
                followBtn.innerHTML = '<i class="fa-solid fa-user-check"></i> Bekor qilish';
            } else {
                followBtn.className = "px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg flex items-center gap-2 bg-primary text-darkBg hover:bg-primaryHover hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10";
                followBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Sodiq mijoz bo\'lish';
            }
        };

        updateBtnUI(isFollowing);

        // FOLLOW BOSILGANDA
        followBtn.addEventListener('click', async () => {
            if (!token) {
                alert("Obuna bo'lish uchun tizimga kiring!");
                window.location.href = '/auth.html';
                return;
            }
            
            try {
                const res = await fetch(`${API_URL}/users/${sellerId}/follow`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                
                // Agar sotuvchi o'ziga-o'zi obuna bo'lmoqchi bo'lsa (Backend to'sadi)
                if (!res.ok) {
                    alert(data.message || "Xatolik yuz berdi!"); // Endi "O'zingizga obuna bo'la olmaysiz" matni chiqadi!
                    return;
                }

                // Agar hammasi joyida bo'lsa raqam o'zgaradi
                isFollowing = !isFollowing;
                updateBtnUI(isFollowing);
                let currentFollowers = parseInt(followersDisplay.innerText);
                followersDisplay.innerText = isFollowing ? currentFollowers + 1 : currentFollowers - 1;

            } catch (error) {
                alert("Tarmoq bilan ulanishda xato!");
            }
        });
    }

    // SOTUVCHI KITOBLARINI CHIZISH FUNKSIYASI
    function renderSellerBooks(books) {
        if (books.length === 0) {
            sellerBooksContainer.innerHTML = '<div class="col-span-full text-center text-grayText py-10 text-lg font-bold bg-darkCard rounded-xl border border-darkBorder">Ushbu sotuvchida hali e\'lonlar yo\'q.</div>';
            return;
        }

        sellerBooksContainer.innerHTML = books.map(book => {
            const imgUrl = book.images && book.images.length > 0 ? `/uploads/${book.images[0]}` : '/uploads/default.jpg';
            const formattedPrice = new Intl.NumberFormat('uz-UZ').format(book.price || 0);

            return `
                <div class="bg-darkCard rounded-2xl shadow-lg hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-darkBorder flex flex-col relative cursor-pointer group" onclick="window.location.href='/book-details.html?id=${book._id}'">
                    
                    <button onclick="toggleLikeOnCard(event, '${book._id}')" class="absolute top-3 right-3 bg-darkBg/80 hover:bg-darkBg backdrop-blur-md p-2.5 rounded-full border border-darkBorder z-10 transition-colors flex items-center justify-center shadow-lg group/btn">
                        <i id="heart-${book._id}" class="fa-regular fa-heart text-gray-500 text-lg group-hover/btn:scale-110 transition-all"></i>
                    </button>

                    <div class="relative overflow-hidden h-56 bg-darkBg">
                        <img src="${imgUrl}" alt="${book.title}" class="w-full h-full object-cover border-b border-darkBorder group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100">
                        <div class="absolute bottom-0 left-0 bg-gradient-to-t from-darkCard to-transparent w-full h-1/2"></div>
                    </div>
                    
                    <div class="p-5 flex-grow flex flex-col relative">
                        <div class="flex justify-between items-start mb-3">
                            <div class="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">${book.genre}</div>
                            <div class="text-xl font-black text-primary">${formattedPrice} <span class="text-xs font-bold text-grayText">so'm</span></div>
                        </div>
                        
                        <h3 class="text-lg font-black text-lightText mb-1 leading-tight truncate">${book.title}</h3>
                        <div class="text-sm text-grayText mb-5 truncate font-medium"><i class="fa-solid fa-pen-nib mr-1"></i> ${book.author}</div>
                        
                        <div class="flex gap-4 mt-auto text-xs text-grayText font-bold bg-darkBg px-4 py-2.5 rounded-xl border border-darkBorder/50">
                            <span class="flex items-center gap-1.5"><i class="fa-solid fa-heart text-red-500"></i> <span id="likeCount-${book._id}">${book.likesCount}</span></span>
                            <span class="flex items-center gap-1.5"><i class="fa-solid fa-comment text-blue-400"></i> ${book.commentsCount}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
});