const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Роздача статичних файлів фронтенду з поточної директорії
app.use(express.static(path.join(__dirname)));

// Локальний набір даних для каталогу
const pets = [
    {
        id: '1',
        name: 'Британська короткошерста',
        species: 'Кіт',
        ageYears: 1,
        image: 'assets/img/cat.jpg',
        notes: 'Спокійний характер, домашній'
    },
    {
        id: '2',
        name: 'Золотистий ретривер',
        species: 'Собака',
        ageYears: 4,
        image: 'assets/img/dog.jpg',
        notes: 'Любить активні прогулянки'
    },
    {
        id: '3',
        name: 'Немо',
        species: 'Риба',
        ageYears: 0.5,
        image: 'assets/img/fish.avif',
        notes: 'Акваріум 50 літрів'
    },
    {
        id: '4',
        name: 'Бордер-коллі',
        species: 'Собака',
        ageYears: 2,
        image: 'assets/img/dog.jpg',
        notes: 'Розумний і надзвичайно енергійний'
    },
    {
        id: '5',
        name: 'Сіамський кіт',
        species: 'Кіт',
        ageYears: 3,
        image: 'assets/img/cat.jpg',
        notes: 'Товариський і допитливий'
    }
];

// GET /api/pets - Отримати весь список тварин
app.get('/api/pets', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(pets);
});

// GET /api/pets/random - Отримати випадкову тварину (заміна зовнішнього Dog CEO API)
app.get('/api/pets/random', (req, res) => {
    const randomIndex = Math.floor(Math.random() * pets.length);
    const randomPet = pets[randomIndex];
    res.setHeader('Content-Type', 'application/json');
    res.json(randomPet);
});

// GET /api/pets/:id - Отримати тварину за ID або повернути 404
app.get('/api/pets/:id', (req, res) => {
    const pet = pets.find(p => String(p.id) === req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Тварину з таким ідентифікатором не знайдено' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(pet);
});

// Обробка неіснуючих API шляхів
app.all('/api/*splat', (req, res) => {
    res.status(404).json({ error: 'API ендпоінт не знайдено' });
});

app.listen(PORT, () => {
    console.log(`Сервер успішно запущено на http://localhost:${PORT}`);
});
