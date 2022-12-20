import db from '../../../lib/db'
import Posting from '../../../models/Posting'
import Offer from '../../../models/Offer'
import Request from '../../../models/Request'
import Adventure from '../../../models/Adventure'

const stripe = require('stripe')(process.env["STRIPE_SECRET_KEY"]);
const domain = 'http://localhost:3000';

export default async function handler(req, res) {

    //Check body of request for posting/offer & id
    const id = req?.body?.id;
    const type = req?.body?.type;
    const userId = req?.body?.userId;
    const userName = req?.body?.userName;
    const userAvatar = req?.body?.userAvatar;
    const groupSize = req?.body?.groupSize;
    const startDate = req?.body?.startDate;

    //Validate the query parameters
    if(!id || !id.length) {
        res.status(400).send({error: 'No id provided in body'});
        return;
    }

    if(!type || !type.length) {
        res.status(400).send({error: 'No type provided in body'});
        return;
    }

    if(!userId || !userId.length) {
        res.status(400).send({error: 'No userId provided in body'});
        return;
    }

    if(!userName || !userName.length) {
        res.status(400).send({error: 'No userName provided in body'});
        return;
    }

    if(!userAvatar || !userAvatar.length) {
        res.status(400).send({error: 'No userAvatar provided in body'});
        return;
    }
2
    //Get a specific posting/offer
    await db()

    //Get the posting/offer price
    let price = 0;
    let title = '';
    let adventure;

    if(type === 'posting') {
        
        //Need to add group size for posting request...
        const posting = await Posting.findOne({_id: id});
        price = posting.unit.includes('flat') ? posting.rate : posting.rate * posting.duration;
        title = posting.title;

        let duration = posting.duration;
        let rate = posting.rate;

        // Convert the duration if there is a difference in units
        if(posting.unit === 'hour') {
            duration = posting.unit === 'hour' ? posting.duration : posting.duration * 24;
        }else if(posting.unit === 'day') {
            duration = posting.unit === 'hour' ? posting.duration / 24 : posting.duration;
        }else if(posting.unit.includes('flat')) {
            duration = groupSize;
        }

        price = rate * duration;

        //Create a new adventure from the posting
        adventure = new Adventure({
            referenceId: posting._id,
            referenceType: 'posting',
            startDate: startDate,
            endDate: new Date(new Date(startDate).getTime() + (duration * 86400000)),
            startTime: posting.startTime,
            guideId: posting.guideId,
            guideName: posting.guideName,
            guideAvatar: posting.guideAvatar,
            userId: userId,
            userName: userName,
            userAvatar: userAvatar,
            groupSize: groupSize,
            price: price,
        });

    }else if(type === 'offer') {
        
        //Get the offer and the related Request
        const offer = await Offer.findOne({_id: id});
        const request = await Request.findOne({_id: offer.requestId});

        let duration = request.duration;
        let rate = offer.rate;

        // Convert the duration if there is a difference in units
        if(offer.unit === 'hour') {
            duration = request.unit === 'hour' ? request.duration : request.duration * 24;
        }else if(offer.unit === 'day') {
            duration = request.unit === 'hour' ? request.duration / 24 : request.duration;
        }else if(offer.unit.includes('flat')) {
            duration = request.groupSize;
        }
        
        price = rate * duration;
        title = request.title;
        
        //Create a new adventure from the request and offer
        adventure = new Adventure({
            referenceId: offer._id,
            referenceType: 'offer',
            startDate: offer.startDate,
            endDate: new Date(offer.startDate.getTime() + (duration * 86400000)),
            startTime: offer.startTime,
            guideId: offer.guideId,
            guideName: offer.guideName,
            guideAvatar: offer.guideAvatar,
            userId: userId,
            userName: userName,
            userAvatar: userAvatar,
            groupSize: request.groupSize,
            price: price,
        });

        //Save new adventure
        try{

            adventure = await adventure.save();

        } catch(err) {

            res.status(500).send({error: err.message});
            return;
            
        }
        
    }else{

        res.status(400).send({error: 'Invalid type provided in body'});
        return;

    }

    //Create a checkout session
    await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'cad',
                product_data: {
                    name: title,
                    images: [
                        'https://images.unsplash.com/photo-1555377707-cf83d17f50fd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8'
                    ]
                },
                unit_amount: price * 100,
            },
            quantity: 1,
        }],

        mode: 'payment',
        success_url: type === 'offer' ? `${domain}/dashboard?success=true&checkout_id={CHECKOUT_SESSION_ID}&adventure_id=${adventure._id}&offer_id=${id}` : `${domain}/dashboard?success=true&checkout_id={CHECKOUT_SESSION_ID}&adventure_id=${adventure._id}`,
        cancel_url: `${domain}/dashboard?canceled=true&adventure_id=${adventure._id}`,

    }).then(session => {

        //Update the adventure with the checkout session id
        adventure['stripeCheckoutSessionId'] = session.id;
        
        try{
            adventure.save();
        } catch(err) {
            res.status(500).send({error: err.message});
            return;
        }

        //Send the response
        res.send({
            sessionId: session.id,
            url: session.url,
        });

    }).catch(err => {
        console.log(err);
        res.status(500).send({error: 'Error creating checkout session'});
    }
    );
}