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
            <h3>{{ pet.name }}</h3>
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
            if (this.currentFilter === 'Всі') {
                return this.animals;
            }
            return this.animals.filter(pet => pet.species === this.currentFilter);
        }
    },

	async mounted() {
        await this.initializeData();
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
            saveToLocalStorage(this.animals);
        },

        // Отримання даних з Dog CEO API
        async loadRandomDog() {
            this.isLoading = true;
            this.apiError = '';

            try {
                const response = await fetch('https://dog.ceo/api/breeds/image/random');

                if (!response.ok) {
                    throw new Error(`Сервер відповів помилкою: ${response.status}`);
                }

                const data = await response.json();

                if (data.status !== 'success') {
                    throw new Error('API повернуло статус помилки всередині JSON');
                }

                const randomDog = {
                    id: String(Date.now()),
                    name: 'Пес',
                    species: 'Собака',
                    ageYears: Math.floor(Math.random() * 10) + 1,
                    image: data.message,
                    notes: 'Отримано з API'
                };

                await savePetToDB(randomDog);
                this.animals.push(randomDog);
                saveToLocalStorage(this.animals);
                this.currentFilter = 'Всі';

            } catch (error) {
                console.error('Помилка завантаження API:', error);
                this.apiError = 'Не вдалося завантажити собаку з API. Перевірте підключення до Інтернету або спробуйте пізніше.';
            } finally {
                this.isLoading = false;
            }
        }
    }
}).mount('#app');
