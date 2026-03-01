// https://khaif.is-a.dev/blogs/azure-functions

import { app } from '@azure/functions';

class HttpError extends Error {
    constructor(status, message, options) {
        super(message, options);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, HttpError);
        }

        this.status = status;
        this.name = 'HttpError';
    }
}

const books = new Map();
books.set(1, {
    id: 1,
    title: 'The Enormous Crocodile',
    author: 'Roald Dahl'
});
books.set(2, {
    id: 2,
    title: 'Harry Potter',
    author: 'J.K. Rowling'
});

app.http('books', {
  route: 'books/{id?}',
  authLevel: 'anonymous',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  handler: booksHandler,
});

async function booksHandler(request, context) {
    const booksRouter = {
        GET: getBookOrBooks,
        POST: createBook,
        PUT: editBook,
        DELETE: deleteBook
    };
    try {
        const handler = booksRouter[request.method];
        if (!handler) {
            return {
                status: 404,
                jsonBody: {
                    message: 'Not Found'
                }
            };
        }
        return await handler(request);
    } catch (err) {
        if (err instanceof HttpError) {
            // Expected so don't log
            return {
                status: Number(err.status),
                jsonBody: {
                    message: err.message,
                }
            }; 
        } else {
            // Unexpected so log the error
            context.error(`${err}`);
            return {
                status: 500,
                jsonBody: {
                    message: 'Internal Server Error'
                }
            };
        }
    }
}

async function getBookById(id) {
    id = Number(id);

    if (!Number.isInteger(id)) {
        throw new HttpError(400, 'Book id must be an integer');
    }

    const book = books.get(id);
    if (!book) {
        throw new HttpError(404, `Book ${id} not found`);
    }

    return book;
}

async function getBookOrBooks(request) {
    if (request.params.id) {
        // Get a single book by its id
        return {
            status: 200,
            jsonBody: {
                ...(await getBookById(request.params.id))
            }
        };
    } else {
        // Get (list) all books
        return {
            status: 200,
            jsonBody: Array.from(books.values())
        };
    }
}

async function createBook(request) {
    const book = await request.json();
    if (!book.title || !book.author) {
        throw new HttpError(400, 'Title and Author are required fields');
    }

    book.id = books.size + 1;
    books.set(book.id, book);

    return {
        status: 201,
        jsonBody: {
            ...book
        }
    };
}

async function editBook(request) {
    const existing = await getBookById(request.params.id);
    const edits = await request.json();
    delete edits.id;
    const book = { ...existing, ...edits };
    books.set(book.id, book);
    return {
        status: 200,
        jsonBody: {
            ...book
        }
    };
}

async function deleteBook(request) {
    const book = await getBookById(request.params.id);
    return {
        status: 200,
        jsonBody: {
            ...book
        }
    };
}