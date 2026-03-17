import { OpenLibraryClient } from "../client";

async function main() {

	const client = new OpenLibraryClient();

	const books = await client.searchByTitle({ query: 'React' });
	console.log(JSON.stringify(books, null, 2));

	const booksBySubject = await client.searchBySubject({ query: 'React' });
	console.log(JSON.stringify(booksBySubject, null, 2));

	const firstBook = books[0];
	if (!firstBook) {
		throw new Error('No books found');
	}

	const book = await client.getBook(firstBook.key);
	console.log(JSON.stringify(book, null, 2));
}


main();