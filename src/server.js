const express = require('express');
const fileUpload = require('express-fileupload');
const Excel = require('exceljs');
const path = require('path');
const config = require('./config.json');
const db = require('./util/database')
const InvoiceGenerator = require('./util/InvoiceGenerator');
const app = express();

const { http: { port } } = config;

// default options
app.use(fileUpload());

app.get('/paperwork/', function (req, res) {
    res.sendFile('index.html', {root: path.join(__dirname, './webfiles/')});
})

app.get('/paperwork/ncr', function (req, res) {
    res.sendFile('NCRs.pdf', {root: path.join(__dirname, './files/')});
})

app.post('/paperwork/', async function(req, res) {
    let ncr;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    ncr = req.files.ncr;

    if(ncr.name.indexOf('.xls') === -1)
        return res.status(400).send('Invalid file type was uploaded.');

    uploadPath = path.join(__dirname, './files/DoubleknotExport.xls');

    let badges = await db.getBadges();

    // Use the mv() method to place the file somewhere on your server
    await ncr.mv(uploadPath, function(err) {
        if (err)
            return res.status(500).send(err);

        //Registrant List By Activity/Class
        // Displays registrant name and group for each session event.

        process.stdout.write('Opening workbook...............')
        const workbook = new Excel.Workbook();

        const options = {
            // https://c2fo.io/fast-csv/docs/parsing/options
            parserOptions: {
                delimiter: '\t',
                quote: false,
            },
        };
        //await workbook.csv.readFile(__dirname + '/DoubleknotExport.xlsx', options).then( function () {});
        workbook.csv.readFile(uploadPath, options).then( async function () {
            process.stdout.write('Done!\n')
            process.stdout.write('Parsing file');
            let scouts = [];
            let troopNum = '';
            for(let i = 2; i < workbook.worksheets[0].columns[0].values.length; i++) {
                if(i % 50 === 0)
                    process.stdout.write('.')
                if(workbook.worksheets[0].columns[0].values[i].indexOf('Group') !== -1)
                    continue;
                if(workbook.worksheets[0].columns[2].values[i].indexOf('(') !== -1)
                    troopNum = workbook.worksheets[0].columns[2].values[i].substring(0, workbook.worksheets[0].columns[2].values[i].indexOf('('));
                if(workbook.worksheets[0].columns[2].values[i].indexOf(':') !== -1)
                    troopNum = workbook.worksheets[0].columns[2].values[i].substring(0, workbook.worksheets[0].columns[2].values[i].indexOf(':'));

                scouts.push({
                    name: workbook.worksheets[0].columns[1].values[i] + ' ' + workbook.worksheets[0].columns[0].values[i],
                    troop: troopNum,
                    badge: workbook.worksheets[0].columns[3].values[i]
                });
            }
            process.stdout.write('Done!');
            const invoiceData = {
                badges: badges,
                scouts: scouts
            }
            const ig = new InvoiceGenerator(invoiceData)
            await ig.generate()
            const intervalObj = setInterval(function() {
                res.redirect('/paperwork/ncr')
                clearInterval(intervalObj);
            }, 2000);
        });
    });
});
console.log(`Connecting to the database...`);
db.connect().then(() => {
    app.listen(port, () => {
        console.log(`Success! Your application is running on port ${port}.`);
    });
});
