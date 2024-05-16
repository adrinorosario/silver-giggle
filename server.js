import express from "express";
import axios from "axios"
import bodyParser from "body-parser";
import pg from "pg";




const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "books_archive",
    password: "rosario",
    port: 5433
});

db.connect();

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({extended:true}));



app.get("/", async (req, res) => {
    const result = await db.query("SELECT * FROM books JOIN notes ON books.book_name = notes.book_name");
    //console.log(result.rows);

    let data = [];

    for (var i = 0; i < result.rows.length; i++) {

        var buffer = Buffer.from(result.rows[i].cover);
        const base64String = buffer.toString('base64');

        var details = {
            bookName: result.rows[i].book_name,
            author: result.rows[i].author_name,
            cover: base64String,
            date: result.rows[i].date_added,
            rating: result.rows[i].rating,
            notes: result.rows[i].notes
        };
        data.push(details);
    };
    
    res.render("index.ejs", {
        data: data
    });
});

app.get("/ratedh", async (req, res) => {
    const result = await db.query("SELECT * FROM books JOIN notes ON books.book_name = notes.book_name ORDER BY books.rating DESC");
    //console.log(result.rows);

    let data = [];

    for (var i = 0; i < result.rows.length; i++) {

        var buffer = Buffer.from(result.rows[i].cover);
        const base64String = buffer.toString('base64');

        var details = {
            bookName: result.rows[i].book_name,
            author: result.rows[i].author_name,
            cover: base64String,
            date: result.rows[i].date_added,
            rating: result.rows[i].rating,
            notes: result.rows[i].notes
        };
        data.push(details);
    };
    res.render("index.ejs", {
        data: data
    });
});

app.get("/ratedl", async (req, res) => {
    const result = await db.query("SELECT * FROM books JOIN notes ON books.book_name = notes.book_name ORDER BY books.rating ASC");
    //console.log(result.rows);

    let data = [];

    for (var i = 0; i < result.rows.length; i++) {

        var buffer = Buffer.from(result.rows[i].cover);
        const base64String = buffer.toString('base64');

        var details = {
            bookName: result.rows[i].book_name,
            author: result.rows[i].author_name,
            cover: base64String,
            date: result.rows[i].date_added,
            rating: result.rows[i].rating,
            notes: result.rows[i].notes
        };
        data.push(details);
    };
    res.render("index.ejs", {
        data: data
    });
});

app.get("/latest", async (req, res) => {
    const result = await db.query("SELECT * FROM books JOIN notes ON books.book_name = notes.book_name ORDER BY books.date_added DESC");
    //console.log(result.rows);

    let data = [];

    for (var i = 0; i < result.rows.length; i++) {

        var buffer = Buffer.from(result.rows[i].cover);
        const base64String = buffer.toString('base64');

        var details = {
            bookName: result.rows[i].book_name,
            author: result.rows[i].author_name,
            cover: base64String,
            date: result.rows[i].date_added,
            rating: result.rows[i].rating,
            notes: result.rows[i].notes
        };
        data.push(details);
    };
    res.render("index.ejs", {
        data: data
    });
});

app.get("/earliest", async (req, res) => {
    const result = await db.query("SELECT * FROM books JOIN notes ON books.book_name = notes.book_name ORDER BY books.date_added ASC");
    //console.log(result.rows);

    let data = [];

    for (var i = 0; i < result.rows.length; i++) {

        var buffer = Buffer.from(result.rows[i].cover);
        const base64String = buffer.toString('base64');

        var details = {
            bookName: result.rows[i].book_name,
            author: result.rows[i].author_name,
            cover: base64String,
            date: result.rows[i].date_added,
            rating: result.rows[i].rating,
            notes: result.rows[i].notes
        };
        data.push(details);
    };
    res.render("index.ejs", {
        data: data
    });
});


app.get("/add", (req, res) => {
    res.render("add.ejs");
});

function utf8ToByteArray(str) {
    let bytes = [];
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        if (code < 0x80) {
            bytes.push(code);
        } else if (code < 0x800) {
            bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        } else if (code < 0x10000) {
            bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        } else {
            bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        }
    }
    return bytes;
}


app.post("/submit-book", async (req, res) => {
    try {
        const data = req.body;
        //console.log(data);

        var bookName = req.body.bookName;
        var rating = req.body.rating;
        var actualBookName = bookName;
        var words_in_name = bookName.split(" ");
        bookName = "";

        for (var i = 0; i < words_in_name.length; i++) {
            bookName = bookName + words_in_name[i]+"+";
        };

        bookName = bookName.substring(0, bookName.length-1);
        bookName.toLowerCase();
        //console.log(bookName);

        const response = await axios.get(`https://openlibrary.org/search.json?title=${bookName}`);
        const result = response.data;
        //console.log(result);

        var author = result.docs[0].author_name[0];
        var cover_id = result.docs[0].cover_i;

        var cover_res = await axios.get(`https://covers.openlibrary.org/b/id/${cover_id}-L.jpg`);
        var cover_img_data = cover_res.data;


        //console.log(bookName, author, description, cover_img_data);

        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        today = mm + '/' + dd + '/' + yyyy;

        await db.query("INSERT INTO books(book_name, author_name, cover, date_added, rating) VALUES ($1, $2, $3, $4, $5)", [
            actualBookName,
            author,
            utf8ToByteArray(cover_img_data),
            today,
            rating
        ]);
        //console.log(utf8ToByteArray(cover_img_data));


        var notes = req.body.notes;

        await db.query("INSERT INTO notes(book_name, notes) VALUES($1, $2)", [
            actualBookName,
            notes
        ]);
        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.render("add.ejs", {error: "Oooppps, something went wrong. Please try again!"});
    }
});

// const result = await axios.get("https://covers.openlibrary.org/b/id/9255566-L.jpg");
// console.log(result.data);

app.listen(PORT, () => {
    console.log(`Successfully running on port ${PORT}`);
});