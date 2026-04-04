import dns from "node:dns";
dns.resolveSrv("_mongodb._tcp.cluster0.bzvmzxp.mongodb.net", (err, addresses) => {
    if (err) {
        console.error("SRV Error:", err);
    } else {
        console.log("SRV Success:", addresses);
    }
});
