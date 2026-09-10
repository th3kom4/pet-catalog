// Перевірка підключення
console.log('app.js підключено успішно!');

// Оголошення даних (масив тварин)
const animals = [
    { name: 'Барсік', species: 'кіт', ageYears: 1 },
    { name: 'Рекс', species: 'собака', ageYears: 4 },
    { name: 'Сніжок', species: 'кіт', ageYears: 5 },
    { name: 'Немо', species: 'риба', ageYears: 0.5 }
];

// Стрілкова функція, що переводить роки в місяці
// Приймає вік у роках і повертає кількість місяців
const ageInMonths = years => years * 12;

// Функція для фільтрації та класифікації тварин
// Обробляє масив циклом, перевіряє вид та класифікує за віком
function processAnimals(petsList) {
    console.log('--- Список котів у каталозі ---');
    
    // Обробка даних циклом for...of
    for (const pet of petsList) {
        
        // Виводимо лише тварин певного виду (котів)
        if (pet.species === 'кіт') {
            
            // Умовна класифікація (якщо менше 2 років - молода, інакше - доросла)
            const ageCategory = pet.ageYears < 2 ? 'молода' : 'доросла';
            
            // Виклик стрілкової функції
            const months = ageInMonths(pet.ageYears);
            
            // Вивід інформації за допомогою рядкових шаблонів
            console.log(`Тварина: ${pet.name} | Вікова категорія: ${ageCategory} | Вік у місяцях: ${months}`);
        }
    }
}

// Викликаємо функцію з нашими даними
processAnimals(animals);
