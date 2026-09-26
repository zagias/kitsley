// user must come from the server-verified authentication session.
export async function checkoutCustomer(stripe,customerId,user){
 // Keep the original creation payload/key stable for retries of older checkouts.
 const customer=customerId?await stripe('customers/'+encodeURIComponent(customerId)):await stripe('customers',{'metadata[kitsley_user]':user.id},'kitsley-customer-'+user.id);
 if(!customer.id||customer.deleted)throw Error('Billing customer unavailable');
 const email=typeof user.email==='string'?user.email.trim():'';
 if(!customer.email&&email)return stripe('customers/'+encodeURIComponent(customer.id),{email});
 return customer;
}
