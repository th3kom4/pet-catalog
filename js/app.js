console.log('app.js підключено успішно!');

// Оголошення даних (додав поле image для відображення фото)
const animals = [
    { name: 'Британська короткошерста', species: 'Кіт', ageYears: 1, image: 'assets/img/cat.jpg' },
    { name: 'Золотистий ретривер', species: 'Собака', ageYears: 4, image: 'assets/img/dog.jpg' },
    { name: 'Немо', species: 'Риба', ageYears: 0.5, image: 'assets/img/fish.avif' }
];

// Видалення статичного прикладу
const staticCards = document.querySelectorAll('.static-card');
staticCards.forEach(card => card.remove()); // Видаляємо вузли з DOM

// Вибір контейнерів
const listContainer = document.querySelector('#pets-list');
const countElement = document.querySelector('#pets-count');

// Функція рендеру
function renderPets(petsArray) {
    // Очищаємо контейнер перед рендером (на випадок повторного виклику)
    listContainer.innerHTML = '';

    for (const pet of petsArray) {
        // Створення елементів
        const card = document.createElement('article'); // Контейнер картки
        
        const title = document.createElement('h3');
        title.textContent = pet.name;
        
        const img = document.createElement('img');
        img.src = pet.image;
        img.classList.add('pet-img'); // Відновлюємо наші CSS-стилі пропорцій
        
        const speciesDesc = document.createElement('p');
        speciesDesc.textContent = `Вид: ${pet.species}`;
        speciesDesc.classList.add('species');

        // Додавання атрибутів та умовних класів
        img.setAttribute('alt', `Фото тварини: ${pet.name}`); // Атрибут img.alt
        card.dataset.species = pet.species.toLowerCase(); // Атрибут data-species

        // Клас: young або adult за ageYears
        if (pet.ageYears < 2) {
            card.classList.add('young');
        } else {
            card.classList.add('adult');
        }

        // Додавання елементів у контейнер
        // Збираємо картку як конструктор
        card.append(title, img, speciesDesc);
        // Вставляємо готову картку на сторінку
        listContainer.append(card);
    }

    // Оновлення підсумкового елемента
    if (countElement) {
        countElement.textContent = `Всього тварин: ${petsArray.length}`;
    }
}

// Виклик рендеру з реальним масивом даних
renderPets(animals);

// 1. Вибір елементів
const addPetForm = document.querySelector('#add-pet-form');
const ageInput = document.querySelector('#pet-age');
const speciesFilter = document.querySelector('#species-filter');

// Додаткова клієнтська валідація
// Валідація на подію 'input' для поля віку
ageInput.addEventListener('input', (event) => {
    const age = Number(event.target.value);

    // Перевірка: вік менше 0 або більше 50
    if (age < 0 || age > 50) {
        // Власне повідомлення про помилку
        event.target.setCustomValidity('Вік тварини має бути від 0 до 50 років!');
    } else {
        // Очищення помилки, якщо значення коректне
        event.target.setCustomValidity('');
    }
});

// Обробка надсилання форми
addPetForm.addEventListener('submit', (event) => {
    // Скасовуємо перезавантаження сторінки
    event.preventDefault();

    // Зчитуємо значення полів
    const nameValue = document.querySelector('#pet-name').value.trim();
    const speciesValue = document.querySelector('#pet-species').value;
    const ageValue = Number(document.querySelector('#pet-age').value);

	// Визначаємо правильний шлях до фотографії залежно від виду
    let imagePath = 'assets/img/cat.jpg';
    
    if (speciesValue === 'Собака') {
        imagePath = 'assets/img/dog.jpg';
    } else if (speciesValue === 'Риба') {
        imagePath = 'assets/img/fish.avif';
    }

    // Збираємо новий об'єкт
    const newPet = {
        name: nameValue,
        species: speciesValue,
        ageYears: ageValue,
        image: imagePath 
    };

    // Додаємо в загальний масив
    animals.push(newPet);

    // Перемальовуємо список
    renderPets(animals);

    // Очищуємо форму
    addPetForm.reset();

    // Скидаємо фільтр на "Всі", щоб точно побачити додану тварину
    speciesFilter.value = 'Всі';
});

// Друга подія варіанта фільтрація
speciesFilter.addEventListener('change', (event) => {
    const selectedSpecies = event.target.value;

    if (selectedSpecies === 'Всі') {
        // Якщо вибрано "Всі", рендеримо весь масив
        renderPets(animals);
    } else {
        // Інакше фільтруємо масив за вибраним видом
        const filteredAnimals = animals.filter(pet => pet.species === selectedSpecies);
        renderPets(filteredAnimals);
    }
});
