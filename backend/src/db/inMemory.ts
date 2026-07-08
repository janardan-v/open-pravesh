interface inMemoryTableInterface {
    [clientId: string]: {
        clientSecret: string;
        authenticationCode: string;
    };
}

const inMemoryTable: inMemoryTableInterface = {};

export default inMemoryTable;