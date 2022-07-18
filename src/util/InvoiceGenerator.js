const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

Array.prototype.sortBy = function(p) {
    return this.slice(0).sort(function(a,b) {
        return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
    });
}

class InvoiceGenerator {
    constructor(invoice) {
        this.invoice = invoice
    }

    generateHeaders(doc, badge) {
        let badgeName = '';
        if(badge.time !== undefined)
            badgeName = badge.name + ' ' + badge.time;
        else
            badgeName = badge.name;

        doc.font('Helvetica')
            .fontSize(10)
            .text('Instructor:_____________________________          Period:________          Year:________', 0, 25, {
                align: 'right',
            });
        doc.moveDown()

        doc.font('Helvetica-Bold')
            .fontSize(15)
            .text(badgeName, 10, 22, {
                align: 'left',
            });
        doc.moveDown()

        doc.font('Helvetica')
            .fontSize(10)
            .text("*If you have any questions, talk to your director", 10, doc.page.height - 15, {
                align: 'left',
                lineBreak: false,
            });
        doc.moveDown()
    }

    generateTable(doc, badge) {
        const tableTop = 50;
        const nameX = 10;
        const troopX = 125;
        const quantityX = 205;
        const priceX = 285;
        const amountX = 335;
        let scouts = this.invoice.scouts.filter(scout => (scout.badge.indexOf(badge.name) !== -1 && scout.badge.indexOf(badge.time) !== -1) || (scout.badge.indexOf(badge.name) !== -1 && badge.time === undefined)).sortBy('troop');

        //console.log(this.invoice.scouts[0].badge + '\t\t' + badge.name + '\t\t\tScouts: ' + scouts.length)

        const week = ['M', 'T', 'W', 'T', 'F'];
        const checkBoxes = ['O', 'B', 'C/P'];

        for(let i = 0; i < 5; i++)
            scouts.push({name:'', troop:'', badge:''})

        const numScouts = Math.ceil(scouts.length / 10);

        if(badge.requirements.length <= 28) {
            for(let i = 0; i < numScouts; i++) {
                let max = 21
                if(scouts.length < 21)
                    max = scouts.length;
                doc.font('Helvetica-Bold')
                    .fontSize(10)
                    .text('Name', nameX, tableTop, {bold: true})
                    .text('Troop', troopX, tableTop)
                    .text('', quantityX, tableTop)
                    .text('', priceX, tableTop)
                    .text('Requirements', amountX, tableTop)
                for (let j = 0; j < max; j++) {
                    const item = scouts[0];
                    if(item === undefined)
                        break;

                    let y = tableTop + 25
                    if(badge.requirements.length > 28)
                        y += (j * 50)
                    else
                        y += (j * 25)
                    doc
                        .font('Helvetica')
                        .fontSize(10)
                        .text(item.name, nameX, y)
                        .text(item.troop, troopX, y)

                    scouts.splice(0, 1);

                    this.generateBoxes(doc, quantityX, y, week);
                    this.generateWeekBoxes(doc, priceX, y, checkBoxes);
                    this.generateRequirementsBoxes(doc, amountX, y, badge.requirements)
                    if(badge.requirements >= 28)
                        y += 25;
                }
                if(i <= max && scouts.length > 0 && scouts[0] !== undefined && scouts[0].name !== '')
                    doc.addPage();
                this.generateHeaders(doc, badge);
            }
        }
        else {
            for(let i = 0; i < numScouts; i++) {
                if(scouts[0] === undefined || scouts[0].name === '')
                    break;
                let max = 13
                if(scouts.length < max)
                    max = scouts.length;
                doc.font('Helvetica-Bold')
                    .fontSize(10)
                    .text('Name', nameX, tableTop, {bold: true})
                    .text('Troop', troopX, tableTop)
                    .text('', quantityX, tableTop)
                    .text('', priceX, tableTop)
                    .text('Requirements', amountX, tableTop)
                for (let j = 0; j < max; j++) {
                    const item = scouts[0];
                    if(item === undefined)
                        break;

                    let y = tableTop + 25
                    if(badge.requirements.length > 28)
                        y += (j * 40)
                    else
                        y += (j * 25)
                    doc
                        .font('Helvetica')
                        .fontSize(10)
                        .text(item.name, nameX, y)
                        .text(item.troop, troopX, y)

                    scouts.splice(0, 1);

                    this.generateBoxes(doc, quantityX, y, week);
                    this.generateWeekBoxes(doc, priceX, y, checkBoxes);
                    this.generateRequirementsBoxes(doc, amountX, y, badge.requirements)
                    if(badge.requirements >= 22)
                        y += 25;
                }
                if(i <= max && scouts.length > 0 && scouts[0] !== undefined && scouts[0].name !== '')
                    doc.addPage();

            this.generateHeaders(doc, badge);
            }
        }
    }

    generateBoxes(doc, x, y, content) {
        var boxOffset = 0;
        for(var j = 0; j < content.length; j++) {
            doc.rect(x + boxOffset, y, 13, 13).fillAndStroke('#ddd', '#000');
            doc.fill('#000').stroke();
            doc.fontSize(10);
            if(content[j] === 'W')
                doc.text(content[j], x + boxOffset + 2, y + 3, {lineBreak: false} );
            else
                doc.text(content[j], x + boxOffset + 3, y + 3, {lineBreak: false} );
            boxOffset += 15;
        }
    }

    generateWeekBoxes(doc, x, y, content) {
        var boxOffset = 0;
        for(var j = 0; j < content.length; j++) {
            doc.rect(x + boxOffset, y, 13, 13).fillAndStroke('#ddd', '#000');
            doc.fill('#000').stroke();
            if(content[j].indexOf('/') !== -1) {
                doc.fontSize(7);
                doc.text(content[j], x + boxOffset + 1, y + 4, {lineBreak: false} );
            }
            else {
                doc.fontSize(10);
                doc.text(content[j], x + boxOffset + 3, y + 3, {lineBreak: false} );
            }
            boxOffset += 15;
        }
    }

    generateRequirementsBoxes(doc, x, y, content) {
        var boxOffset = 0, textOffset = 0;
        for(var j = 0; j < content.length; j++) {
            if(j >= 28 && j % 28 === 0) {
                y += 16;
                boxOffset = 0;
            }
            doc.fontSize(7);
            switch (content[j].toString().length) {
                case 1:
                    textOffset = 4.25;
                    break;
                case 2:
                    textOffset = 1.5;
                    break;
                case 3:
                    textOffset = 1.5;
                    doc.fontSize(5);
                    break;
                case 4:
                    textOffset = 1.5;
                    doc.fontSize(5);
                    break;
                default:
                    textOffset = 4.25;
                    break;
            }
            doc.rect(x + boxOffset, y, 13, 13).fillAndStroke('#ddd', '#000');
            doc.fill('#000').stroke();
            doc.text(content[j], x + textOffset + boxOffset + 0.5, y + 3.5, {lineBreak: false} );
            boxOffset += 16;
        }
    }

    async generate() {
        console.log('\nImporting ' + this.invoice.badges.length + ' classes..........Done!');
        let theOutput = new PDFDocument({ layout: 'landscape', margins: { top: 0, bottom: 0, left: 0, right: 10} });

        const fileName = path.join(__dirname, '../files/NCRs.pdf')

        process.stdout.write('Generating NCR\'s')

        for(let i = 0; i < this.invoice.badges.length; i++) {
            if(this.invoice.badges[i].time !== undefined && this.invoice.badges[i].time.length !== 0) {
                for(let j = 0; j < this.invoice.badges[i].time.length; j++) {
                    let badge = {
                        name: this.invoice.badges[i].name,
                        time: this.invoice.badges[i].time[j],
                        requirements: this.invoice.badges[i].requirements
                    }

                    if(i % 4 === 0)
                        process.stdout.write('.')
                    theOutput.pipe(fs.createWriteStream(fileName))

                    this.generateHeaders(theOutput, badge)

                    theOutput.moveDown()

                    this.generateTable(theOutput, badge)

                    if(i !== this.invoice.badges.length - 1)
                        theOutput.addPage();
                }
            }
            else {
                if(i % 4 === 0)
                    process.stdout.write('.')
                theOutput.pipe(fs.createWriteStream(fileName))

                this.generateHeaders(theOutput, this.invoice.badges[i])

                theOutput.moveDown()

                this.generateTable(theOutput, this.invoice.badges[i])

                if(i !== this.invoice.badges.length)
                    theOutput.addPage();
            }
        }
        process.stdout.write('Done!')
        console.log('\nWriting PDF')
        // write out file
        theOutput.end()
        console.log('Done!')
        return true;
    }
}

module.exports = InvoiceGenerator
