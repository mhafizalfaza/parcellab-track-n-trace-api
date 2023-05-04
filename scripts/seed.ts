const path = require("path");
const csv = require("fast-csv");
const fs = require("fs");
const lambdaTester = require("lambda-tester");
const { create } = require("../app/handler/shipments");
const Spinner = require("cli-spinner").Spinner;

var spinner = new Spinner("Seeding... %s");
spinner.setSpinnerString("|/-\\");

let shipmentRows = [];

spinner.start();

fs.createReadStream(path.resolve(__dirname, "../assets", "shipments.csv"))
  .pipe(csv.parse({ headers: true }))
  .on("error", (error) => console.error(error))
  .on("data", async (shipment) => {
    shipmentRows.push(shipment);
  })
  .on("end", async (rowCount: number) => {
    for (const shipment of shipmentRows) {
      await lambdaTester(create)
        .event({
          body: JSON.stringify({
            ...shipment,
            article_price: Number(shipment.article_price),
            article_quantity: Number(shipment.article_quantity),
          }),
        })
        .expectResult();
    }

    console.log(`${rowCount} shipments have been created!`);
    process.exit(1);
  });
