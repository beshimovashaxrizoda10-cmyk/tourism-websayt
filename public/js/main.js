// --- QAT'IY XAVFSIZLIK (Sahifa ochilmasidan tekshirish) ---
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/auth.html';
} else {
    document.getElementById('mainBody').style.display = 'flex';
}

const API_URL = 'http://localhost:5000/api';
let userLikedBooks = []; 

// --- LAYK BOSISH (Karta ustida) ---
window.toggleLikeOnCard = async function(event, bookId) {
    event.stopPropagation(); 
    if (!token) return;

    const heartIcon = document.getElementById(`heart-${bookId}`);
    const countSpan = document.getElementById(`likeCount-${bookId}`);
    
    try {
        const res = await fetch(`${API_URL}/books/${bookId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if(data.success) {
            let currentCount = parseInt(countSpan.innerText);
            if (heartIcon.classList.contains('fa-regular')) {
                heartIcon.className = 'fa-solid fa-heart text-red-500 text-lg transition-all';
                countSpan.innerText = currentCount + 1;
                userLikedBooks.push(bookId);
            } else {
                heartIcon.className = 'fa-regular fa-heart text-gray-500 text-lg transition-all';
                countSpan.innerText = currentCount - 1;
                userLikedBooks = userLikedBooks.filter(id => id !== bookId);
            }
        }
    } catch(e) { console.error("Layk xatosi:", e); }
};

document.addEventListener('DOMContentLoaded', () => {
    const booksContainer = document.getElementById('booksContainer');
    const resultsCount = document.getElementById('resultsCount');
    const genreSelect = document.getElementById('genreSelect');
    const authorInput = document.getElementById('authorInput');
    const titleInput = document.getElementById('titleInput');
    const authorSuggestions = document.getElementById('authorSuggestions');
    const titleSuggestions = document.getElementById('titleSuggestions');
    const filterSearchBtn = document.getElementById('filterSearchBtn');
    const globalSearchInput = document.getElementById('globalSearchInput');

    initApp();

    async function initApp() {
        await checkUserAuth();
        await fetchUserLikes();
        await fetchBooks();
        await fetchGenres();
    }

    async function checkUserAuth() {
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('userName').textContent = data.data.firstName;
                document.getElementById('userInitial').textContent = `${data.data.firstName.charAt(0)}${data.data.lastName.charAt(0)}`.toUpperCase();
                document.getElementById('logoutBtn').addEventListener('click', () => {
                    localStorage.removeItem('token');
                    window.location.href = '/auth.html';
                });
            } else {
                localStorage.removeItem('token');
                window.location.href = '/auth.html';
            }
        } catch (error) { console.error("Auth xato:", error); }
    }

    async function fetchUserLikes() {
        try {
            const res = await fetch(`${API_URL}/users/me/likes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if(data.success) userLikedBooks = data.data;
        } catch (e) { console.error("Layklar yuklanmadi"); }
    }

    async function fetchBooks(queryParams = '') {
        try {
            booksContainer.innerHTML = '<div class="col-span-full text-center py-10"><i class="fa-solid fa-spinner fa-spin text-4xl text-primary"></i></div>';
            const response = await fetch(`${API_URL}/books${queryParams}`);
            const resData = await response.json();
            if (resData.success) {
                renderBooks(resData.data);
                resultsCount.textContent = `${resData.count} ta e'lon topildi`;
            }
        } catch (error) {
            booksContainer.innerHTML = '<div class="col-span-full text-center text-red-400 py-10">Xatolik yuz berdi!</div>';
        }
    }

    function renderBooks(books) {
        if (books.length === 0) {
            booksContainer.innerHTML = '<div class="col-span-full text-center text-grayText py-10 text-lg font-bold bg-darkCard rounded-3xl border border-darkBorder">Kitoblar topilmadi.</div>';
            return;
        }

        booksContainer.innerHTML = books.map(book => {
            const imgUrl = book.images && book.images.length > 0 ? `/uploads/${book.images[0]}` : '/uploads/default.jpg';
            const formattedPrice = new Intl.NumberFormat('uz-UZ').format(book.price || 0);
            const seller = book.seller || { firstName: 'Sotuvchi', lastName: '', phoneNumber: "", region: "", district: "" };
            const isLiked = userLikedBooks.includes(book._id);
            const heartClass = isLiked ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart text-gray-500';

            return `
                <!-- transform-gpu va isolate burchaklar qirralik bo'lishini oldini oladi -->
                <div class="bg-darkCard rounded-3xl shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden border border-darkBorder flex flex-col relative cursor-pointer group isolate transform-gpu" onclick="window.location.href='/book-details.html?id=${book._id}'">
                    <button onclick="toggleLikeOnCard(event, '${book._id}')" class="absolute top-3 right-3 bg-darkBg/80 hover:bg-darkBg backdrop-blur-md p-2.5 rounded-full border border-darkBorder z-10 transition-colors flex items-center justify-center shadow-lg group/btn">
                        <i id="heart-${book._id}" class="${heartClass} text-lg group-hover/btn:scale-110 transition-all"></i>
                    </button>
                    
                    <!-- Rasm konteyneri ham rounded-t-3xl bo'lishi shart -->
                    <div class="relative overflow-hidden h-60 bg-darkBg rounded-t-3xl">
                        <img src="${imgUrl}" alt="${book.title}" class="w-full h-full object-cover border-b border-darkBorder group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100 transform-gpu">
                        <div class="absolute bottom-0 left-0 bg-gradient-to-t from-darkCard to-transparent w-full h-1/2"></div>
                    </div>
                    
                    <div class="p-5 flex-grow flex flex-col relative">
                        <div class="flex justify-between items-start mb-3">
                            <div class="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">${book.genre}</div>
                            <div class="text-xl font-black text-primary">${formattedPrice} <span class="text-xs font-bold text-grayText">so'm</span></div>
                        </div>
                        <h3 class="text-lg font-black text-lightText mb-1 leading-tight truncate" title="${book.title}">${book.title}</h3>
                        <div class="text-sm text-grayText mb-5 truncate font-medium"><i class="fa-solid fa-pen-nib mr-1 opacity-60"></i> ${book.author}</div>
                        
                        <div class="mt-auto pt-4 border-t border-darkBorder/50 space-y-2">
                            <div class="flex items-center text-xs text-grayText">
                                <i class="fa-solid fa-user text-primary w-5 text-center"></i>
                                <span class="font-bold text-lightText">${seller.firstName} ${seller.lastName}</span>
                            </div>
                            <div class="flex items-center text-xs text-grayText">
                                <i class="fa-solid fa-location-dot text-primary w-5 text-center"></i>
                                <span class="truncate font-medium">${seller.region}, ${seller.district}</span>
                            </div>
                        </div>
                        <div class="flex gap-4 mt-5 text-xs text-grayText font-bold bg-darkBg/50 px-4 py-2.5 rounded-2xl border border-darkBorder/50">
                            <span class="flex items-center gap-1.5"><i class="fa-solid fa-heart text-red-500"></i> <span id="likeCount-${book._id}">${book.likesCount}</span></span>
                            <span class="flex items-center gap-1.5"><i class="fa-solid fa-comment text-blue-400"></i> ${book.commentsCount}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // JONLI QIDIRUV
    let searchTimeout;
    globalSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const q = e.target.value.trim();
        searchTimeout = setTimeout(() => {
            fetchBooks(q ? `?q=${q}` : '');
        }, 400);
    });

    // === TAHRIRLANGAN DROPDOWN (Silliq va burchaklari buzilmaydigan) ===
    const handleSuggestion = async (input, suggestions, type) => {
        const val = input.value.trim();
        if (val.length < 1) { 
            suggestions.classList.add('hidden'); 
            return; 
        }

        try {
            const genre = genreSelect.value;
            const author = type === 'title' ? authorInput.value : '';
            const res = await fetch(`${API_URL}/books/suggestions?type=${type}&search=${val}&genre=${genre}&author=${author}`);
            const data = await res.json();
            
            if (data.success && data.data.length > 0) {
                // overflow-hidden va transform-gpu burchaklarni saqlaydi
                suggestions.className = "absolute z-[100] top-full left-0 right-0 bg-darkCard border-2 border-primary rounded-2xl shadow-2xl mt-2 overflow-hidden transform-gpu animate-fade-in";
                
                suggestions.innerHTML = data.data.map(item => 
                    `<div class="p-3 hover:bg-primary/10 hover:text-primary cursor-pointer text-sm border-b border-darkBorder/30 last:border-0 text-lightText font-bold transition-all suggestion-item flex items-center gap-2">
                        <i class="fa-solid fa-magnifying-glass text-[10px] text-primary/50"></i>
                        ${item}
                    </div>`
                ).join('');
                
                suggestions.classList.remove('hidden');

                suggestions.querySelectorAll('.suggestion-item').forEach(el => {
                    el.addEventListener('click', () => {
                        input.value = el.textContent.trim();
                        suggestions.classList.add('hidden');
                        if(type === 'author') titleInput.value = '';
                    });
                });
            } else { 
                suggestions.classList.add('hidden'); 
            }
        } catch (e) { console.error("Suggestion error", e); }
    };

    authorInput.addEventListener('input', () => handleSuggestion(authorInput, authorSuggestions, 'author'));
    titleInput.addEventListener('input', () => handleSuggestion(titleInput, titleSuggestions, 'title'));

    document.addEventListener('click', (e) => {
        if (!authorInput.contains(e.target)) authorSuggestions.classList.add('hidden');
        if (!titleInput.contains(e.target)) titleSuggestions.classList.add('hidden');
    });

    filterSearchBtn.addEventListener('click', () => {
        const params = new URLSearchParams();
        if (genreSelect.value) params.append('genre', genreSelect.value);
        if (authorInput.value) params.append('author', authorInput.value);
        if (titleInput.value) params.append('title', titleInput.value);
        fetchBooks(`?${params.toString()}`);
        globalSearchInput.value = '';
    });

    async function fetchGenres() {
        try {
            const response = await fetch(`${API_URL}/books/suggestions?type=genre`);
            const resData = await response.json();
            if (resData.success) {
                resData.data.forEach(genre => {
                    const option = document.createElement('option');
                    option.value = genre;
                    option.textContent = genre;
                    genreSelect.appendChild(option);
                });
            }
        } catch (error) {}
    }
});