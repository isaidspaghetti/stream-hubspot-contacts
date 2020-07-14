const express = require('express');
const router = express.Router();
const StreamChat = require('stream-chat');
const Hubspot = require('hubspot');
require('dotenv').config();

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

//CREATE A CUSTOMER IN HUBSPOT
async function createHubspotContact(firstName, lastName) {
  const hubspot = new Hubspot({
    apiKey: process.env.HUBSPOT_API_KEY,
    checkLimit: false
  })

  const contactObj = {
    properties: [
      { property: 'firstname', value: firstName },
      { property: 'lastname', value: lastName },
      {
        property: 'your_custom_property',
        value: 'anything you want, even a multi-line \n string'
      }
    ]
  }
  const hubspotContact = hubspot.contacts.create(contactObj)
}


//CREATE USER OBJECTS
function createUsers(firstName, lastName) {
  const customer = {
    id: `${firstName}-${lastName}`.toLowerCase(),
    name: firstName,
    role: 'user',
  };

  const supporter = {
    id: 'adminId',
    name: 'unique-admin-name',
    role: 'admin'
  }
  return [customer, supporter]
}

router.post('/registrations', async (req, res, next) => {
  try {
    const firstName = req.body.firstName.replace(/\s/g, '_');
    const lastName = req.body.lastName.replace(/\s/g, '_');

    await createHubspotContact(firstName, lastName)

    const client = new StreamChat.StreamChat(apiKey, apiSecret);

    [customer, supporter] = createUsers(firstName, lastName)

    await client.upsertUsers([
      customer,
      supporter
    ]);

    const channel = client.channel('messaging', customer.id, {
      members: [customer.id, supporter.id],
    });

    const customerToken = client.createToken(customer.id);

    res.status(200).json({
      customerId: customer.id,
      customerToken,
      channelId: channel.id,
      apiKey,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

