// Shared pure domain logic: all money is integer paise.
export function quote(menu, lines, restaurant, coupon, type, now = new Date()) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 50) throw new Error('Your cart must contain 1-50 lines.');
  if (!['DELIVERY', 'PICKUP'].includes(type)) throw new Error('Choose delivery or pickup.');
  const resolved = lines.map(line => {
    const item = menu.find(item => item.id === line.itemId);
    if (!item || !item.available) throw new Error('An item is no longer available.');
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) throw new Error('Quantity must be between 1 and 20.');
    const ids = [...new Set(line.optionIds || [])];
    const options = ids.map(id => {
      const option = item.options.find(option => option.id === id);
      if (!option) throw new Error('A selected option is unavailable.');
      return option;
    });
    const unitPrice = item.price + options.reduce((sum, option) => sum + option.price, 0);
    return {itemId:item.id, name:item.name, quantity:line.quantity, unitPrice, options, notes:String(line.notes || '').slice(0,300)};
  });
  const subtotal = resolved.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  if (subtotal < restaurant.minimum) throw new Error('Minimum order is ₹' + restaurant.minimum / 100 + '.');
  let discount = 0;
  if (coupon) {
    if (!coupon.active || new Date(coupon.expiresAt) <= now || coupon.used >= coupon.limit || subtotal < coupon.minimum) throw new Error('Coupon is expired, unavailable or minimum spend is not met.');
    discount = Math.min(subtotal, coupon.maximum, coupon.kind === 'FIXED' ? coupon.value : Math.round(subtotal * coupon.value / 100));
  }
  const tax = Math.round((subtotal - discount) * restaurant.taxBasisPoints / 10000);
  const delivery = type === 'DELIVERY' ? restaurant.delivery : 0;
  const packaging = restaurant.packaging;
  return {lines:resolved,subtotal,discount,tax,delivery,packaging,total:subtotal-discount+tax+delivery+packaging};
}
export function nextStatuses(status, type) {
  const flow = type === 'PICKUP' ? ['PENDING','CONFIRMED','PREPARING','READY','DELIVERED'] : ['PENDING','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED'];
  const index = flow.indexOf(status);
  return index < 0 || index === flow.length-1 ? [] : [flow[index+1], ...(index < 2 ? ['CANCELLED'] : [])];
}
export function overlaps(aStart,aEnd,bStart,bEnd) {return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);}
export function reservationWindow(day,time,now=new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^(1[2-9]|2[01]):(00|30)$/.test(time)) throw new Error('Choose a slot between 12:00 and 21:30 IST.');
  const start = new Date(day+'T'+time+':00+05:30');
  const localDay = new Date(+start+330*60000).toISOString().slice(0,10);
  if(localDay!==day)throw new Error('Choose a valid calendar date.');
  if (!Number.isFinite(+start) || start <= now || +start > +now+30*86400000) throw new Error('Book a future slot within the next 30 days.');
  return {startsAt:start,endsAt:new Date(+start+90*60000)};
}
export function recommend(menu, question, restaurant) {
  const q = question.toLowerCase();
  if (/open|hours|close/.test(q)) return restaurant.hours + '. All reservation times are IST.';
  if (/where|location|address/.test(q)) return restaurant.address + '. This is a demo venue; confirm the real address before travelling.';
  if (/book|reserv/.test(q)) return 'Use Book a table to choose an available slot. I do not make a booking without your confirmation.';
  const budget = q.match(/(?:under|below|budget|₹|rs\.?)[\s]*(\d+)/i);
  const filtered = menu.filter(i => i.available && (!/vegetarian|\bveg\b/.test(q) || i.veg) && (!/dessert|sweet/.test(q) || i.category==='Desserts') && (!/spicy/.test(q) || i.spice >= 2) && (!budget || i.price <= Number(budget[1])*100));
  if (!filtered.length) return 'No available dishes match that request. Try a higher budget or another category.';
  return filtered.slice(0,3).map(i=>i.name+' - ₹'+i.price/100).join('; ')+'. Prices exclude checkout fees. Tell our team about allergies; cross-contact cannot be ruled out.';
}
