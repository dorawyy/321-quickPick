require("dotenv").config();
const { MongoClient } = require("mongodb");

const sessionHelper = require("../../controllers/session");
const dbHelper = require("../db/mongodb");

const List = require("../../models/list");
const User = require("../../models/user");
const session = require("../../controllers/session");
const Session = require("../../models/session");
const { textSpanIntersectsWithPosition } = require("typescript");

jest.mock("../../plugins/firebase");

/*
Mongodb setup*/

let TestUserID = "FacebookId123";
let TestUserID2 = "murphy";
let list_id = "";

const mockRequest = () => {
    const req = {
        body: {
            listID: "",
            choices: [],
        },
        params: {
            id: ""
        }
    };
    return req;
};

const mockResponse = () => {
    const res = {};
    res.body = {};
    res.status = jest.fn().mockReturnValue(res);
    // res.send = jest.fn().mockReturnValue(res);
    res.send = (result) => {
        res.body = JSON.parse(JSON.stringify(result));
    };

    res.locals = {
        id: ""
    };
    return res;

};

beforeEach(async () => {
    await dbHelper.connect();

    /* Clear out the database */
    await Session.deleteMany({});
    await User.deleteMany({});
    await List.deleteMany({});

    /* We have one mock session, two mock users, and one mock list for testing */

    let newUser = {
        name: "me",
        id: TestUserID
    }
    await User.create(newUser);
    let newUser1 = {
        name: "me2",
        id: TestUserID2
    }
    await User.create(newUser1);

    let list = {
        userID: TestUserID,
        name: "Food Cuisines",
        ideas: [
            {
                name: "Italian"
            },
            {
                name: "French"
            },
            {
                name: "Mexican"
            }
        ]
    };
    await List.create(list);

    let foundList = await List.findOne({});
    list_id = foundList._id;

    let newSession = {
        pin: "abcd",
        listID: "",
        status: "lobby",
        creator: TestUserID,
        complete: 0,
        results: [],
        participants: [{
            name: "me",
            id: TestUserID,
        }]
    };
    await Session.create(newSession);
});

afterAll(async () => {
    await dbHelper.close();
});

/*
Module Tests!
*/
describe("Create Session", function () {
    it("User has not logged in before", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = "murphy1234";

        await sessionHelper.createSession(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        done();
    });

    it("Success", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;

        await sessionHelper.createSession(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        done();
    });
});

describe("Get Session", function () {
    it("Session doesn't exist", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "one hundred thousand";

        await sessionHelper.getSession(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        done();
    });

    it("User is not in session", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = "murphy";
        req.params.id = "abcd";

        await sessionHelper.getSession(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        done();
    });

    it("Success", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "abcd"

        await sessionHelper.getSession(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        done();
    });
});

describe("Add user to session", function () {
    it("Session doesn't exist", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "murphyisthecutest";

        await sessionHelper.addUser(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        done();
    });

    it("User is already in session or full", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "abcd";

        await sessionHelper.addUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        done();
    });

    it("Session has started", async (done) => {
        let newSession = {
            pin: "abcde",
            listID: "",
            status: "running",
            creator: TestUserID,
            complete: 0,
            results: [],
            participants: [{
                name: "me",
                id: TestUserID,
            }]
        };
        await Session.create(newSession);

        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID2;
        req.params.id = "abcde";

        await sessionHelper.addUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        done();
    });

    it("Success", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID2;
        req.params.id = "abcd";

        await sessionHelper.addUser(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        done();
    });
});

describe("Update session list", function () {
    it("Invalid listID", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "abcd";
        req.body.listID = 1000;

        await sessionHelper.updateList(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        done();
    });

    it("List does not exist", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "abcd";
        req.body.listID = "44444f31dcd5af2ff413441b"; //Theres a tiny chance this will actually pass by accident

        await sessionHelper.updateList(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        done();
    });

    it("Session doesn't exist", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "10000";
        req.body.listID = list_id.toString();
        console.log(req.body.listID);

        await sessionHelper.updateList(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        done();
    });

    it("Success", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "abcd";
        req.body.listID = list_id.toString();

        await sessionHelper.updateList(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        done();
    });
});

describe("Get session list", function () {
    it("User is not in session", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID2;
        req.params.id = "abcd";

        await sessionHelper.getList(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        done();
    });

    it("Success does not exist", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "abcde";

        await sessionHelper.getList(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        done();
    });

    it("Success", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "abcd";
        await Session.findOneAndUpdate({ pin: "abcd" }, { listID: list_id });

        await sessionHelper.getList(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        done();
    });
});

describe("Start session", function () {
    it("Session does not exist", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "12300";

        await sessionHelper.startSession(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        done();
    });

    it("User is not owner", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID2;
        req.params.id = "abcd";

        await sessionHelper.startSession(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        done();
    });

    it("Invalid list ID", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "abcd";

        await sessionHelper.startSession(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        done();
    });

    it("Success", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "abcd";
        await Session.findOneAndUpdate({ pin: "abcd" }, { listID: list_id });

        await sessionHelper.startSession(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        done();
    });
});

describe("Receive choices", function () {
    it("Invalid params", async (done) => {
        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "10231";

        await sessionHelper.receiveChoices(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        done();
    });

    it("User is not in session", async (done) => {
        let newSession = {
            pin: "abcde",
            listID: "",
            status: "running",
            creator: TestUserID,
            complete: 0,
            results: [{idea: {name: "Italian"}, score: 0}, {idea: {name: "French"}, score: 0}, {idea: {name: "Mexican"}, score: 0}],
            participants: [{
                name: "me",
                id: TestUserID,
            }]
        };
        await Session.create(newSession);

        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = "murphy123";
        req.params.id = "abcde";

        await sessionHelper.receiveChoices(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        done();
    });

    it("Success, complete", async (done) => {
        let newSession = {
            pin: "abcde",
            listID: "",
            status: "running",
            creator: TestUserID,
            complete: 0,
            results: [{idea: {name: "Italian"}, score: 0}, {idea: {name: "French"}, score: 0}, {idea: {name: "Mexican"}, score: 0}],
            participants: [{
                name: "me",
                id: TestUserID,
            }]
        };
        await Session.create(newSession);

        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "abcde";
        req.body.choices = [
            {
                idea: { name: "Italian" }, choice: true
            },
            {
                idea: { name: "French" }, choice: false
            },
            {
                idea: { name: "Mexican" }, choice: true
            },
        ];

        await sessionHelper.receiveChoices(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        done();
    });

    it("Success, not complete", async (done) => {
        let newSession = {
            pin: "abcde",
            listID: "",
            status: "running",
            creator: TestUserID,
            complete: 0,
            results: [{idea: {name: "Italian"}, score: 0}, {idea: {name: "French"}, score: 0}, {idea: {name: "Mexican"}, score: 0}],
            participants: [{
                name: "me",
                id: TestUserID,
            },{
                name: "him",
                id: TestUserID2
            }]
        };
        await Session.create(newSession);

        const req = mockRequest();
        const res = mockResponse();
        res.locals.id = TestUserID;
        req.params.id = "abcde";
        req.body.choices = [
            {
                idea: { name: "Italian" }, choice: true
            },
            {
                idea: { name: "French" }, choice: false
            },
            {
                idea: { name: "Mexican" }, choice: true
            },
        ];

        await sessionHelper.receiveChoices(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        done();
    });
});