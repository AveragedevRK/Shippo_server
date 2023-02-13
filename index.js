const app = require("express")();
const ship = require("shippo")("shippo_live_2b219c308720797c10624d24704e367378f382cf");

const {carriers, warehouse, addresses} = require("./const");

var addressTo = {
  "name": "Test Buyer",
  "street1": "148 n main st",
  "city": "Hughesville",
  "state": "PA",
  "zip": "17737",
  "country": "US"
}

async function rate(length, width, height, weight) {
  var parcel = {
  "length": length,
  "width": width,
  "height": height,
  "distance_unit": "in",
  "weight": weight,
  "mass_unit": "lb"
  };
    
  return await ship.shipment.create({
    "address_from": warehouse,
    "address_to": addresses['PA'],
    "parcels": [parcel],
    "async": false
  })
  .then(shipment => {
    let least = Number(shipment.rates[0].amount_local);
    let leastAcc = shipment.rates[0].carrier_account;
    let service = shipment.rates[0].servicelevel;
    for (i of shipment.rates) {
      if (Number(i.amount_local) < least) {
        least = Number(i.amount_local);
        leastAcc = i.carrier_account;
        service = i.servicelevel;
      }
    }
    return {least, leastAcc, service, carriers: carriers[leastAcc]};
  })

}

app.get("/:length/:width/:height/:weight", async (req, res) => {
  let {length, width, height, weight} = req.params;
  let rates = await rate(length, width, height, weight);
  console.log(rates);

  res.set ("Content-type", "text/xml");
  console.log(rates);
  res.send(`
    <label>
      <cost>
        ${rates.least}
      </cost>
  
      <Account>
        <id>
          ${rates.leastAcc}
        </id>
        <AccountName>
          ${rates.carriers.meta}
        </AccountName>
      </Account>
      <Service>
        <Carrier>
          ${rates.service.name}
        </Carrier>
        <ServiceName>
          ${rates.service.token}
        </ServiceName>
      </Service>
    </label>
  `);
})

app.listen(8080)
