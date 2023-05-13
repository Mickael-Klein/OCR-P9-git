/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import store from "../__mocks__/store.js";
import "@testing-library/jest-dom/extend-expect";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-window"));
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon.classList.contains("active-icon")).toBe(true); // expect check que la classe active-icon est bien présente pour la mise en surbrillance de mail icon
    });

    test("Then newBill page should be displayed", () => {
      const newBillForm = screen.getByTestId("form-new-bill");
      expect(newBillForm).toBeTruthy();
    });

    test("Then a form with nine fields should be rendered", () => {
      const form = document.querySelector("form");
      expect(form.length).toEqual(9);
    });

    describe("When I add an attached file", () => {
      test("Then the file handler should be triggered", async () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });

        document.body.innerHTML = NewBillUI();
        await waitFor(() => screen.getByTestId("file"));

        const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
        const file = screen.getByTestId("file");

        file.addEventListener("change", handleChangeFile);
        fireEvent.change(file, {
          target: {
            files: [new File(["file"], "file.jpg", { type: "image/jpg" })],
          },
        });

        expect(handleChangeFile).toHaveBeenCalled();
      });

      test("Then file with right type should be uploaded", async () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });

        document.body.innerHTML = NewBillUI();
        await waitFor(() => screen.getByTestId("file"));

        const file = screen.getByTestId("file");

        file.addEventListener("change", newBill.handleChangeFile);
        fireEvent.change(file, {
          target: {
            files: [new File(["file"], "file.jpg", { type: "image/jpg" })],
          },
        });

        expect(file.files.length).toEqual(1);
        expect(file.files[0].name).toBe("file.jpg");
        expect(newBill.fileName).toBe("file.jpg");
      });

      test("Then files with type different from jpg, jpeg, or png should result in error message displayed", async () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });

        document.body.innerHTML = NewBillUI();
        await waitFor(() => screen.getByTestId("file"));

        const file = screen.getByTestId("file");

        const consoleSpy = jest.spyOn(console, "log");

        file.addEventListener("change", newBill.handleChangeFile);
        fireEvent.change(file, {
          target: {
            files: [new File(["file"], "file.webp", { type: "image/webp" })],
          },
        });

        const errorMsg = document.querySelector("#errorMsg");
        expect(errorMsg).toHaveStyle({ display: "block" });
        expect(newBill.fileName).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          "Le fichier n'est pas au bon format ! Formats acceptés: jpeg, jpg, png"
        );
      });
      test("Submitting a correct form should call handleSubmit method and redirect user on Bill page", async () => {
        const formNewBill = screen.getByTestId("form-new-bill");
        const inputExpenseName = screen.getByTestId("expense-name");
        const inputExpenseType = screen.getByTestId("expense-type");
        const inputDatepicker = screen.getByTestId("datepicker");
        const inputAmount = screen.getByTestId("amount");
        const inputVAT = screen.getByTestId("vat");
        const inputPCT = screen.getByTestId("pct");
        const inputCommentary = screen.getByTestId("commentary");
        const inputFile = screen.getByTestId("file");

        // Datas to input
        const inputData = {
          type: "Transports",
          name: "Test",
          datepicker: "2023-04-24",
          amount: "1000",
          vat: "20",
          pct: "20",
          commentary: "Test Mocked Data",
          file: new File(["test"], "test.jpeg", { type: "image/jpeg" }),
        };

        // Input mocked datas
        fireEvent.change(inputExpenseType, {
          target: { value: inputData.type },
        });
        expect(inputExpenseType.value).toBe(inputData.type);

        fireEvent.change(inputExpenseName, {
          target: { value: inputData.name },
        });
        expect(inputExpenseName.value).toBe(inputData.name);

        fireEvent.change(inputDatepicker, {
          target: { value: inputData.datepicker },
        });
        expect(inputDatepicker.value).toBe(inputData.datepicker);

        fireEvent.change(inputAmount, {
          target: { value: inputData.amount },
        });
        expect(inputAmount.value).toBe(inputData.amount);

        fireEvent.change(inputVAT, {
          target: { value: inputData.vat },
        });
        expect(inputVAT.value).toBe(inputData.vat);

        fireEvent.change(inputPCT, {
          target: { value: inputData.pct },
        });
        expect(inputPCT.value).toBe(inputData.pct);

        fireEvent.change(inputCommentary, {
          target: { value: inputData.commentary },
        });
        expect(inputCommentary.value).toBe(inputData.commentary);

        userEvent.upload(inputFile, inputData.file);
        expect(inputFile.files[0]).toBe(inputData.file);
        expect(inputFile.files).toHaveLength(1);

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage,
        });

        const handleSubmitSpy = jest.spyOn(newBill, "handleSubmit");

        formNewBill.addEventListener("submit", newBill.handleSubmit);
        fireEvent.submit(formNewBill);

        await waitFor(() => screen.getByText("Mes notes de frais"));
        const onBillPage = screen.getByText("Mes notes de frais");
        expect(onBillPage).toBeTruthy();
        expect(handleSubmitSpy).toHaveBeenCalled();
      });
    });
  });
});

describe("When I navigate to Dashboard employee", () => {
  describe("Given I am a user connected as Employee, and a user post a newBill", () => {
    test("Add a bill from mock API POST", async () => {
      const postSpy = jest.spyOn(mockStore, "bills");
      const bill = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20,
      };
      const postBills = await mockStore.bills().update(bill);
      expect(postSpy).toHaveBeenCalled();
      expect(postBills).toStrictEqual(bill);
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        document.body.innerHTML = NewBillUI();

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
      });
      test("Fail to add bill and receive 404 error message from API", async () => {
        const postSpy = jest.spyOn(console, "error");

        const store = {
          bills: jest.fn(() => newBill.store),
          create: jest.fn(() => Promise.resolve({})),
          update: jest.fn(() => Promise.reject(new Error("404"))),
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });

        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);

        fireEvent.submit(form);
        await new Promise(process.nextTick);
        expect(postSpy).toBeCalledWith(new Error("404"));
      });
      test("Fail to add bill and receive 500 error message from API", async () => {
        const postSpy = jest.spyOn(console, "error");

        const store = {
          bills: jest.fn(() => newBill.store),
          create: jest.fn(() => Promise.resolve({})),
          update: jest.fn(() => Promise.reject(new Error("500"))),
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });

        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);

        fireEvent.submit(form);
        await new Promise(process.nextTick);
        expect(postSpy).toBeCalledWith(new Error("500"));
      });
    });
  });
});
