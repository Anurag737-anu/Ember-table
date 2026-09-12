export type Item={id:string;name:string;description:string;category:string;price:number;image:string;veg:boolean;available:boolean;featured:boolean;calories:number;allergens:string[];ingredients:string[];spice:number;prepMinutes:number;options:{id:string;name:string;price:number}[]};
export type CartLine={itemId:string;quantity:number;optionIds:string[];notes:string};
export type User={id:string;name:string;email:string;role:string;points:number};
export type Order={id:string;status:string;paymentStatus:string;total:number;createdAt:string;type:string;lines:any[]};
