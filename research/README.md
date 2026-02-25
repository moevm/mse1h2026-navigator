# Парсинг Wikipedia

## Исследование

Конкретно RestAPI Wikipedia, чтобы можно было удобно получать ответы в JSON формате найдено не было. Поэтому запросы отправляются непосредственно на сайт вики.

## GET запрос

https://ru.wikipedia.org/w/index.php?search=что+ищем
вместо *что+ищем*  - статья для поиска

Запрос вернет html страницу. Далее возможны два сценария:
1) **Соответствий запросу не найдено.** Типичный случай 404.
2) Список статей и других ненужных ссылок. Для дальнейшего парсинга планируется использовать веб кравлер *Puppeteer*. 

### Пример извлечения ссылок из статьи с помощью Puppeter

```js
async function getAllLinks() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://ru.wikipedia.org/wiki/JavaScript');
  
  // Извлекаем все ссылки из основного контента
  const links = await page.evaluate(() => {
    const content = document.getElementById('mw-content-text');
    const links = content.querySelectorAll('a');
    
    return Array.from(links).map(link => ({
      text: link.textContent,
      href: link.href,
      title: link.getAttribute('title')
    })).filter(link => link.href && link.href.startsWith('http'));
  });
  
  console.log('Найдено ссылок:', links.length);
  console.log('Первые 5 ссылок:', links.slice(0, 5));
  
  await browser.close();
}
```

## Примеры запросов

### Запрос 1

GET-REQUEST:

https://ru.wikipedia.org/w/index.php?search=sadfsadgf

Фрагмент ответа:

```HTML
<div class="searchresults">

                    <div class="mw-search-results-info">

                        <p class="mw-search-nonefound">

                            Соответствий запросу не найдено.</p>

                        <p class="mw-search-createlink">
```

Совпадений не было найдено.

### Запрос 2

GET-REQUEST:

https://ru.wikipedia.org/w/index.php?search=python

Фрагмент ответа:

```HTML
<div id="content" class="mw-body" role="main">

        <a id="top"></a>

        <div id="siteNotice"><!-- CentralNotice --></div>

        <div class="mw-indicators">

        </div>

        <h1 id="firstHeading" class="firstHeading mw-first-heading"><span class="mw-page-title-main">Python</span></h1>

        <div id="bodyContent" class="vector-body">
        
            <div id="siteSub" class="noprint">Материал из Википедии — свободной энциклопедии</div>
```

В данном случае, когда имеется статья с конкретным названием, сайт ридеректит запрос на эту статью.

### Запрос 3

GET-REQUEST:

https://ru.wikipedia.org/w/index.php?search=pythonn

Фрагмент ответа:

```HTML
<div class="searchdidyoumean">Показаны результаты для «<a href="/w/index.php?title=%D0%A1%D0%BB%D1%83%D0%B6%D0%B5%D0%B1%D0%BD%D0%B0%D1%8F:%D0%9F%D0%BE%D0%B8%D1%81%D0%BA&amp;search=python&amp;fulltext=1&amp;profile=default"
title="Служебная:Поиск" id="mw-search-DYM-rewritten"><em>python</em></a>». Для «pythonn» результаты не найдены.</div>
```

В данном случае, точного совпадения найдено не было, поэтому сайт возвращает список возможных статей

## Ответ контроллера

Фрагмент статьи в текстовом формате, описание интересуемой технологии

## Структура

Еще не решено, как будет происходить синхронизация различных ресурсов. Поскольку парсер wikipedia не единственный. Возможно два решения.

### Паттерн стратегия

Система парсинга веб-ресурсов, реализованная на основе паттерна "Стратегия", представляет собой гибкую и масштабируемую архитектуру, обеспечивающую единообразный интерфейс доступа к различным источникам данных. 
Такой подход обеспечивает высокую степень модульности, упрощает добавление новых источников данных без модификации существующего кода, гарантирует отказоустойчивость через встроенные механизмы retry и кэширования, а также предоставляет развитые средства мониторинга и отладки процесса парсинга через событийно-ориентированную архитектуру.

![](https://i.sstatic.net/Mtlxp.png)

### Стандартный MVC

Идея состоит в том, чтобы использовать множество репозиториев, сервисов и контроллеров, причем каждая тройка из которых будет независима друг от друга. Использование строгой типизации, в свою очередь, будет очень полезно. Данное решение имеет место быть в силу своей простоты, однако такая структура очень нежелательна, если планируется дальнейшее масштабирование приложения.  