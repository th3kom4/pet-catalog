const { createApp } = Vue;

// Оголошення компонента PetCard
const PetCard = {
    // props - дані, які компонент отримує від батьківського списку
    props: ['name', 'species', 'ageYears', 'image'],
    
    data() {
        return {
            // Локальний реактивний стан компонента (прапорець "обране")
            isFavorite: false 
        };
    },
    
    // Шаблон картки з динамічними класами та подією кліку
    template: `
        <article 
            :class="{ young: ageYears < 2, adult: ageYears >= 2 }" 
            @click="isFavorite = !isFavorite" 
            style="cursor: pointer; position: relative;"
        >
            <h3>{{ name }}</h3>
            <!-- Зірочка з'явиться тільки якщо isFavorite === true -->
            <span v-if="isFavorite" style="position: absolute; top: 10px; right: 10px; font-size: 24px;">⭐</span>
            <img :src="image" :alt="'Фото тварини: ' + name" class="pet-img">
            <p class="species">Вид: {{ species }}</p>
            <p>Вік: {{ ageYears }} р.</p>
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
            animals: [
                { name: 'Британська короткошерста', species: 'Кіт', ageYears: 1, image: 'assets/img/cat.jpg' },
                { name: 'Золотистий ретривер', species: 'Собака', ageYears: 4, image: 'assets/img/dog.jpg' },
                { name: 'Немо', species: 'Риба', ageYears: 0.5, image: 'assets/img/fish.avif' }
            ],
            
            // Стан для фільтрації
            currentFilter: 'Всі',
            
            // Об'єкт для збору даних з форми додавання
            newPet: {
                name: '',
                species: 'Кіт',
                ageYears: 0
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
    
    // Обробники подій та функції
    methods: {
        // Додавання нової тварини
        addNewPet() {
            let imagePath = 'assets/img/cat.jpg';
            if (this.newPet.species === 'Собака') {
                imagePath = 'assets/img/dog.jpg';
            } else if (this.newPet.species === 'Риба') {
                imagePath = 'assets/img/fish.avif';
            }

            // Додаємо об'єкт у масив, Vue сам оновить DOM
            this.animals.push({
                name: this.newPet.name,
                species: this.newPet.species,
                ageYears: this.newPet.ageYears,
                image: imagePath
            });

            // Очищаємо форму
            this.newPet.name = '';
            this.newPet.species = 'Кіт';
            this.newPet.ageYears = 0;
            
            // Скидаємо фільтр
            this.currentFilter = 'Всі';
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

                this.animals.push({
                    name: 'Пес',
                    species: 'Собака',
                    ageYears: Math.floor(Math.random() * 10) + 1,
                    image: data.message
                });
                
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
