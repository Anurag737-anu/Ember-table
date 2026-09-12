import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
const db=new PrismaClient();
const photo=(id:string)=>'https://images.unsplash.com/'+id+'?auto=format&fit=crop&w=1000&q=85';
const dishes=[
 ['woodfire-pizza','Wood-fired Margherita','Blistered sourdough, crushed tomatoes, fresh mozzarella and garden basil.','Pizza',44900,'photo-1579751626657-72bc17010498',true,['Milk','Gluten'],['Sourdough','Tomatoes','Mozzarella','Basil'],1],
 ['burrata','Burrata & heirloom tomatoes','Creamy burrata, sun-ripened tomatoes, basil oil and toasted sourdough.','Starters',39500,'photo-1515543904379-3d757afe72e4',true,['Milk','Gluten'],['Burrata','Tomatoes','Basil'],0],
 ['paneer','Smoked paneer tikka','Charred cottage cheese, a bright mint chutney and pickled onion.','Indian',34900,'photo-1565557623262-b51c2513a641',true,['Milk'],['Paneer','Yogurt','Peppers','Spices'],2],
 ['butter-chicken','Old Delhi butter chicken','Tandoor-roasted chicken in a slow-simmered tomato and cultured cream sauce.','Indian',49500,'photo-1603894584373-5ac82b2ae398',false,['Milk','Nuts'],['Chicken','Tomato','Cream','Cashews'],2],
 ['pasta','Wild mushroom linguine','Silky linguine, roasted mushrooms, parmesan and a little truffle.','Pasta',42500,'photo-1473093295043-cdd812d0e601',true,['Gluten','Milk'],['Pasta','Mushroom','Parmesan'],0],
 ['burger','The ember burger','Flame-grilled chicken, aged cheddar, house pickles and golden fries.','Burgers',38500,'photo-1568901346375-23c9450c58cd',false,['Gluten','Milk','Egg'],['Chicken','Brioche','Cheddar'],1],
 ['salad','Green goddess bowl','Crisp greens, avocado, cucumber, grains and a bright herb dressing.','Salads',29500,'photo-1512621776951-a57141f2eefd',true,[],['Greens','Avocado','Quinoa'],0],
 ['dessert','Chocolate after dark','Warm chocolate fondant with vanilla ice cream and a pinch of sea salt.','Desserts',27500,'photo-1578985545062-69928b1d9587',true,['Gluten','Milk','Egg'],['Chocolate','Flour','Egg','Vanilla'],0],
 ['lemonade','Basil & lime cooler','Fresh lime, hand-torn basil and sparkling water over ice.','Beverages',16500,'photo-1513558161293-cdaf765edfd7',true,[],['Lime','Basil','Sparkling water'],0],
 ['soup','Roasted tomato soup','Slow-roasted tomatoes, basil cream and a sourdough crisp.','Soups',22500,'photo-1547592180-85f173990554',true,['Milk','Gluten'],['Tomato','Basil','Cream'],1],
 ['biryani','Hyderabadi vegetable biryani','Layered basmati, saffron, caramelized onions and slow-cooked garden vegetables.','Indian',37500,'photo-1631515243349-e0cb75fb8d3a',true,[],['Basmati rice','Saffron','Vegetables','Spices'],2],
 ['momos','Steamed veg momos','Delicate dumplings filled with cabbage, carrot and spring onion, with a fiery chutney.','Starters',24500,'photo-1563245372-f21724e3856d',true,['Gluten'],['Flour','Cabbage','Carrot','Spring onion'],2],
 ['fries','Loaded ember fries','Crisp fries tossed with smoked paprika, parmesan and herb aioli.','Sides',19500,'photo-1630431341636-999a7e047f3b',true,['Milk'],['Potato','Parmesan','Herbs'],1],
 ['choco-torte','Layered chocolate torte','Rich cocoa sponge, dark chocolate ganache and a dusting of cocoa.','Desserts',29500,'photo-1517427294546-5aa121f68e8a',true,['Gluten','Milk','Egg'],['Chocolate','Flour','Egg','Cream'],0],
 ['cold-coffee','Iced cold coffee','Chilled espresso, milk and a whisper of vanilla over ice.','Beverages',17500,'photo-1676506739319-70bff65bfc48',true,['Milk'],['Coffee','Milk','Vanilla'],0]
] as const;
async function main(){
 await db.restaurant.upsert({where:{id:'main'},create:{id:'main'},update:{}});
 for(const [id,name,description,category,price,image,veg,allergens,ingredients,spice] of dishes){
  await db.category.upsert({where:{name:category},create:{name:category},update:{}});
  await db.menuItem.upsert({where:{id},update:{},create:{id,name,description,category,price,image:photo(image),veg,allergens:[...allergens],ingredients:[...ingredients],spice,featured:['woodfire-pizza','burrata','paneer','pasta'].includes(id),calories:category==='Beverages'?120:520,prepMinutes:20,options:category==='Beverages'?[]:[{id:'large',name:'Large portion',price:12000},{id:'cheese',name:'Extra cheese (milk)',price:6000},{id:'sauce',name:'House sauce',price:3000}]}});
 }
 for(let i=1;i<=8;i++)await db.diningTable.upsert({where:{id:'T'+i},create:{id:'T'+i,seats:i<=3?2:i<=6?4:8,area:i%2?'Dining room':'Terrace'},update:{}});
 await db.coupon.upsert({where:{code:'EMBER10'},create:{code:'EMBER10',kind:'PERCENT',value:10,minimum:50000,maximum:15000,expiresAt:new Date(Date.now()+365*86400000),limit:1000},update:{}});
 const email=process.env.SEED_ADMIN_EMAIL;const password=process.env.SEED_ADMIN_PASSWORD;
 if(!email||!password||password.length<12)throw new Error('Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 12 characters.');
 await db.user.upsert({where:{email},create:{name:'Restaurant Admin',email,password:await bcrypt.hash(password,12),role:'ADMIN'},update:{}});
 console.log('Seed complete. Demo PINs: 400050, 400051, 400052. Coupon EMBER10: 10% off ₹500+, capped at ₹150.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>db.$disconnect());
