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
