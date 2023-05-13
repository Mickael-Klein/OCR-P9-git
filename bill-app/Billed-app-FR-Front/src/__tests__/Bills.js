/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import Bills from "../containers/Bills.js";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import store from "../__mocks__/store.js";

jest.mock("../app/store", () => mockStore);

const $ = require("jquery");
require("jquery-modal");

// Vérifier la présence de jQuery
if (typeof jQuery === "undefined") {
  throw new Error("jQuery is not loaded");
}

// Vérifier la présence de jQuery.modal
if (typeof jQuery.fn.modal === "undefined") {
  throw new Error("jQuery.modal is not loaded");
}

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
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
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true); // expect check que la classe active-icon est bien présente pour la mise en surbrillance de window icon
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    // Début nouveaux tests
    describe("When user clicks on the new bill button", () => {
      test("then func handleClickNewBill should be call with NewBill route path as parameter", () => {
        const onNavigate = jest.fn();
        const bill = new Bills({ document, onNavigate, store, localStorage });
        const newBillBtn = screen.getByTestId("btn-new-bill");
        userEvent.click(newBillBtn);
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
      });
    });
    describe("When user clicks on the eye icon of a bill", () => {
      const modal = document.querySelector("#modaleFile");

      test("modal should be defined", () => {
        expect(modal).toBeDefined();
      });

      describe("Test if jQuery and jQuery.modal are available", () => {
        test("jQuery should be available", () => {
          expect(typeof jQuery).toBe("function");
        });

        test("jQuery.modal should be available", () => {
          expect(typeof jQuery.fn.modal).toBe("function");
        });
      });

      test("modal should display the image of the clicked bill with right width", () => {
        const eyeIcon = screen.getAllByTestId("icon-eye");
        const firstEyeIcon = eyeIcon[0];
        const billUrl = firstEyeIcon.getAttribute("data-bill-url");
        const imgWidth = Math.floor($("#modaleFile").width() * 0.5);

        userEvent.click(firstEyeIcon);

        const modalBody = document.body.querySelector(".modal-body");
        const imgContainer = modalBody.querySelector(".bill-proof-container");
        const img = imgContainer.querySelector("img");

        const decodedBillUrl = decodeURIComponent(billUrl);
        const decodedImgSrcUrl = decodeURIComponent(img.src);

        expect(decodedImgSrcUrl).toBe(decodedBillUrl);
        expect(img.width).toBe(imgWidth);
      });
    });
  });
});

// Test d'intégration getBills

describe("Given I am connected as an employee", () => {
  let root;
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  describe("When I am on Bills Page", () => {
    test("loading page is displayed during loading", async () => {
      // Test loading page avec fichier fixture
      window.onNavigate(ROUTES_PATH.Bills);
      const loadingPageLoaded = await screen.getByText("Loading...");
      expect(loadingPageLoaded).toBeTruthy();
    });

    test("error page is displayed on error", async () => {
      // Test error page avec fichier fixture
      document.body.innerHTML = BillsUI({ data: bills, error: true });
      window.onNavigate(ROUTES_PATH.Bills);
      const errorPageLoaded = await screen.getByText("Erreur");
      expect(errorPageLoaded).toBeTruthy();
    });

    describe("when API is called", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
      });

      test("fetch bills from mock API GET", async () => {
        // Test GET API
        const bills = await mockStore.bills().list();
        document.body.innerHTML = BillsUI({ data: bills });
        window.onNavigate(ROUTES_PATH.Bills);
        const mockedDatasDisplayed = await screen.getByText("test1");
        expect(mockedDatasDisplayed).toBeTruthy();
      });

      describe("when an error occurs on API", () => {
        test("fetches bills from an API and fails with 404 message error", async () => {
          // Test 404 Error
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list: () => {
                return Promise.reject(new Error("Erreur 404"));
              },
            };
          });
          window.onNavigate(ROUTES_PATH.Bills);
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 404/);
          expect(message).toBeTruthy();
        });

        test("fetches messages from an API and fails with 500 message error", async () => {
          // Test 500 Error
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list: () => {
                return Promise.reject(new Error("Erreur 500"));
              },
            };
          });

          window.onNavigate(ROUTES_PATH.Bills);
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 500/);
          expect(message).toBeTruthy();
        });
      });
    });
  });
});
