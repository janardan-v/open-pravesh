
interface inMemoryTableInterface {
    
    [authenticationCode: string]: {
        expiresAt: number,
        clientId: string,
        clientSecret: string,
        userId: string,
        userEmail: string,
    };
}

const inMemoryTable: inMemoryTableInterface = {};

console.log(inMemoryTable);
export default inMemoryTable;