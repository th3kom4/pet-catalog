const DB_NAME = 'PetCatalogDB';
const DB_VERSION = 1;
const STORE_NAME = 'pets';

// Ініціалізація та відкриття IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Додавання або оновлення запису в IndexedDB
async function savePetToDB(pet) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(pet);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Отримання всіх записів з IndexedDB
async function getAllPetsFromDB() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Видалення запису з IndexedDB за id
async function deletePetFromDB(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Допоміжні функції для роботи з localStorage
function saveToLocalStorage(items) {
    localStorage.setItem('petCatalogItems', JSON.stringify(items));
}

function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem('petCatalogItems');
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error('Помилка розбору даних з localStorage:', error);
        return null;
    }
}

const { createApp } = Vue;

// Оголошення компонента PetCard
const PetCard = {
    props: ['pet'],
    emits: ['delete-pet'],
    data() {
        return {
            // Локальний реактивний стан компонента (прапорець "обране")
            isFavorite: false
        };
    },
    
    // Шаблон картки з динамічними класами, нотатками та кнопкою видалення
    template: `
        <article 
            :class="{ young: pet.ageYears < 2, adult: pet.ageYears >= 2 }" 
            @click="isFavorite = !isFavorite" 
            style="cursor: pointer; position: relative;"
        >
            <h3>
				<a :href="'#/pets/' + pet.id" @click.stop style="color: inherit; text-decoration: none;">
                    {{ pet.name }}
                </a>
			</h3>
            <!-- Зірочка з'явиться тільки якщо isFavorite === true -->
            <span v-if="isFavorite" style="position: absolute; top: 10px; right: 10px; font-size: 24px;">⭐</span>
            <img :src="pet.image" :alt="'Фото тварини: ' + pet.name" class="pet-img">
            <p class="species">Вид: {{ pet.species }}</p>
            <p>Вік: {{ pet.ageYears }} р.</p>
            <p v-if="pet.notes" style="font-style: italic; font-size: 0.9em; color: #666;">
                Нотатки: {{ pet.notes }}
            </p>
            <button 
                @click.stop="$emit('delete-pet', pet.id)" 
                style="margin-top: auto; padding: 6px 12px; background-color: #e57373; color: white; border: none; border-radius: 4px; cursor: pointer;"
            >
                Видалити
            </button>
        </article>
    `
};

// Створення головного Vue-застосунку
createApp({
    // Реєструємо компонент для використання в HTML
    components: {
        'pet-card': PetCard
    },
    
    // Реактивний стан
    data() {
        return {
            // Масив даних каталогу
           	animals: [],
			isAnimationRunning: true,
            animationFrameId: null,
            fishList: [],

			// Стан клієнтського роутера
            currentRoute: {
                name: 'home',
                params: {}
            },

            // Стан для фільтрації
            currentFilter: 'Всі',
            
            // Об'єкт для збору даних з форми додавання
            newPet: {
                name: '',
                species: 'Кіт',
                ageYears: 0,
				notes: ''
            },
            
            // Стани для роботи з API
            isLoading: false,
            apiError: ''
        };
    },
    
    // Похідні (обчислювані) значення
    computed: {
        // Автоматична фільтрація масиву
        filteredPets() {
			// Якщо користувач перейшов за маршрутом #/species/:species
            if (this.currentRoute.name === 'species' && this.currentRoute.params.species) {
                const targetSpecies = decodeURIComponent(this.currentRoute.params.species);
                return this.animals.filter(pet => pet.species.toLowerCase() === targetSpecies.toLowerCase());
            }

			if (this.currentFilter === 'Всі') {
                return this.animals;
            }
            return this.animals.filter(pet => pet.species === this.currentFilter);
        },
		selectedPet() {
            if (this.currentRoute.name === 'pet-detail' && this.currentRoute.params.id) {
                return this.animals.find(pet => String(pet.id) === String(this.currentRoute.params.id));
            }
            return null;
        }
    },

	async mounted() {
        await this.initializeData();
		this.initCanvasAquarium();

		// Ініціалізація клієнтської маршрутизації
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },
    
    // Обробники подій та функції
    methods: {
        // Додавання нової тварини
		async initializeData() {
            try {
                // Початкова ініціалізація localStorage при першому запуску
                if (!localStorage.getItem('petCatalogItems') && !localStorage.getItem('petsMigratedToIDB')) {
                    const initialPets = [
                        { id: '1', name: 'Британська короткошерста', species: 'Кіт', ageYears: 1, image: 'assets/img/cat.jpg', notes: 'Спокійний характер' },
                        { id: '2', name: 'Золотистий ретривер', species: 'Собака', ageYears: 4, image: 'assets/img/dog.jpg', notes: 'Любить активні прогулянки' },
                        { id: '3', name: 'Немо', species: 'Риба', ageYears: 0.5, image: 'assets/img/fish.avif', notes: 'Акваріум 50 літрів' }
                    ];
                    saveToLocalStorage(initialPets);
                }

                let dbPets = await getAllPetsFromDB();

                // Одноразова міграція з localStorage в IndexedDB
                if (dbPets.length === 0 && !localStorage.getItem('petsMigratedToIDB')) {
                    const localData = loadFromLocalStorage();
                    if (localData && localData.length > 0) {
                        for (const pet of localData) {
                            await savePetToDB(pet);
                        }
                        localStorage.setItem('petsMigratedToIDB', 'true');
                        dbPets = await getAllPetsFromDB();
                    }
                }

                this.animals = dbPets;
				this.syncFishCount();
                saveToLocalStorage(this.animals);
            } catch (error) {
                console.error('Помилка доступу до IndexedDB:', error);
                this.animals = loadFromLocalStorage() || [];
            }
        },

        // Додавання нової тварини
        async addNewPet() {
            let imagePath = 'assets/img/cat.jpg';
            if (this.newPet.species === 'Собака') {
                imagePath = 'assets/img/dog.jpg';
            } else if (this.newPet.species === 'Риба') {
                imagePath = 'assets/img/fish.avif';
            }

            const createdPet = {
                id: String(Date.now()),
                name: this.newPet.name,
                species: this.newPet.species,
                ageYears: this.newPet.ageYears,
                image: imagePath,
                notes: this.newPet.notes
            };

            await savePetToDB(createdPet);
            this.animals.push(createdPet);
			this.syncFishCount();
            saveToLocalStorage(this.animals);

            // Очищаємо форму
            this.newPet.name = '';
            this.newPet.species = 'Кіт';
            this.newPet.ageYears = 0;
            this.newPet.notes = '';
            this.currentFilter = 'Всі';
        },

        // Видалення тварини за id
        async deletePet(id) {
            await deletePetFromDB(id);
            this.animals = this.animals.filter(pet => pet.id !== id);
			this.syncFishCount();
            saveToLocalStorage(this.animals);
        },

        // Отримання даних з Dog CEO API
        async loadRandomDog() {
            this.isLoading = true;
            this.apiError = '';

            try {
                const response = await fetch('api/pets/random');

                if (!response.ok) {
                    throw new Error(`Сервер відповів помилкою: ${response.status}`);
                }

				const serverPet = await response.json();

                // Створюємо унікальний запис на основі отриманого об'єкта
                const newPetEntry = {
                    id: String(Date.now()),
                    name: `${serverPet.name}`,
                    species: serverPet.species,
                    ageYears: serverPet.ageYears,
                    image: serverPet.image,
                    notes: serverPet.notes || 'Отримано з локального Node.js API'
                };

                await savePetToDB(newPetEntry);
                this.animals.push(newPetEntry);
				this.syncFishCount();
                saveToLocalStorage(this.animals);
                this.currentFilter = 'Всі';

            } catch (error) {
                console.error('Помилка завантаження з API сервера:', error);
                this.apiError = 'Не вдалося завантажити тварину з локального сервера. Перевірте роботу node server.js.';
            } finally {
                this.isLoading = false;
            }
        },

		// Обробка зміни маршруту на основі location.hash
        handleRoute() {
            const rawHash = window.location.hash.slice(1) || '/';
            const cleanPath = rawHash.split('?')[0];

            // Таблиця патернів маршрутів
            const routes = [
                { pattern: /^\/$/, name: 'home' },
                { pattern: /^\/pets\/([^/]+)$/, name: 'pet-detail', paramKeys: ['id'] },
                { pattern: /^\/species\/([^/]+)$/, name: 'species', paramKeys: ['species'] }
            ];

            for (const route of routes) {
                const match = cleanPath.match(route.pattern);
                if (match) {
                    const params = {};
                    if (route.paramKeys) {
                        route.paramKeys.forEach((key, index) => {
                            params[key] = match[index + 1];
                        });
                    }
                    this.currentRoute = { name: route.name, params };

                    // Якщо повертаємось на головну — переконуємось що canvas активний
                    if (route.name === 'home' || route.name === 'species') {
                        this.$nextTick(() => {
                            this.initCanvasAquarium();
                        });
                    }
                    return;
                }
            }

            // Якщо збігу не знайдено — маршрут 404
            this.currentRoute = { name: 'not-found', params: {} };
        },

		// Ініціалізація та синхронізація рибок із кількістю тварин
        initCanvasAquarium() {
            const canvas = document.getElementById('aquariumCanvas');
            if (!canvas) return;

            this.syncFishCount();
            this.startAnimation();
        },

        syncFishCount() {
            const canvas = document.getElementById('aquariumCanvas');
            if (!canvas) return;

            // Кількість рибок відповідає кількості тварин у каталозі (мінімум 1, максимум 15)
            const targetCount = Math.min(Math.max(this.animals.length, 1), 15);

            while (this.fishList.length < targetCount) {
                this.fishList.push({
                    x: Math.random() * canvas.width,
                    baseY: 30 + Math.random() * (canvas.height - 60),
                    speed: 1 + Math.random() * 1.5,
                    amplitude: 8 + Math.random() * 12,
                    frequency: 0.02 + Math.random() * 0.03,
                    color: ['#ff7043', '#ffa726', '#26a69a', '#ab47bc'][Math.floor(Math.random() * 4)],
                    size: 14 + Math.random() * 8
                });
            }

            while (this.fishList.length > targetCount) {
                this.fishList.pop();
            }
        },

        // Малювання однієї рибки з тілом, хвостом і оком
        drawFish(ctx, fish, time) {
            // Рух по синусоїді: y = baseY + sin(x * frequency) * amplitude
            const y = fish.baseY + Math.sin((fish.x + time) * fish.frequency) * fish.amplitude;

            ctx.save();
            ctx.translate(fish.x, y);

            ctx.fillStyle = fish.color;

            // Тіло рибки (еліпс)
            ctx.beginPath();
            ctx.ellipse(0, 0, fish.size, fish.size * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();

            // Хвіст (трикутник)
            ctx.beginPath();
            ctx.moveTo(-fish.size * 0.8, 0);
            ctx.lineTo(-fish.size * 1.5, -fish.size * 0.45);
            ctx.lineTo(-fish.size * 1.5, fish.size * 0.45);
            ctx.closePath();
            ctx.fill();

            // Око
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(fish.size * 0.45, -fish.size * 0.15, fish.size * 0.15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(fish.size * 0.5, -fish.size * 0.15, fish.size * 0.08, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        },

        // Цикл анімації через requestAnimationFrame
        renderAquarium() {
            const canvas = document.getElementById('aquariumCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const time = Date.now() * 0.05;

            for (const fish of this.fishList) {
                fish.x += fish.speed;
                if (fish.x - fish.size * 2 > canvas.width) {
                    fish.x = -fish.size * 2;
                    fish.baseY = 30 + Math.random() * (canvas.height - 60);
                }
                this.drawFish(ctx, fish, time);
            }

            if (this.isAnimationRunning) {
				this.animationFrameId = requestAnimationFrame(() => this.renderAquarium());
            }
        },

        startAnimation() {
            if (!this.isAnimationRunning) {
                this.isAnimationRunning = true;
            }
            cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = requestAnimationFrame(() => this.renderAquarium());
        },

        stopAnimation() {
            this.isAnimationRunning = false;
            cancelAnimationFrame(this.animationFrameId);
        },

        toggleAnimation() {
            if (this.isAnimationRunning) {
                this.stopAnimation();
            } else {
                this.startAnimation();
            }
        }
    }
}).mount('#app');
