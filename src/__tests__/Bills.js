/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    test("Then bills should be ordered from earliest to latest", async () => {
      // исправление ошибки
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const bill = new Bills({document, onNavigate, store:mockStore, localStorage: null})
      const allBills = await bill.getBills()
      const dates = allBills.map(bill => bill.date)
      // document.body.innerHTML = BillsUI({ data: bills })
      // const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      // const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      // const datesSorted = [...dates].sort(antiChrono)
      // expect(dates).toEqual(datesSorted)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    // the begining of my test
    test("The page of creating a new bill is opened when I click on the button new-bill", async () => {
      document.body.innerHTML = BillsUI({ data: bills })
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      const bill = new Bills({document, onNavigate, store:mockStore, localStorage: null})
      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const button = screen.getByTestId('btn-new-bill')
      const handleClickNewBill1 = jest.fn((e) => bill.handleClickNewBill(e))
      button.addEventListener('click', handleClickNewBill1)
      userEvent.click(button)
      expect(handleClickNewBill1).toHaveBeenCalled()
    })

    test("Then I click on the eye icon the dialog with the picture should be opening", async () => {
      $.fn.modal = jest.fn()
      document.body.innerHTML = BillsUI({ data: bills })
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      const bill = new Bills({document, onNavigate, store:mockStore, localStorage: null})
      await waitFor(() => screen.queryAllByTestId('icon-eye'))
      const eye = screen.queryAllByTestId('icon-eye')
      const handleClickIconEye1 = jest.fn((e) => bill.handleClickIconEye(e))
      eye[0].addEventListener('click', () => handleClickIconEye1(eye[0]))
      userEvent.click(eye[0])
      expect(handleClickIconEye1).toHaveBeenCalled()
    })
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const button = await screen.getByTestId('btn-new-bill')
      expect(button).toBeTruthy()
      const type = await screen.getAllByText('Type')
      expect(type).toBeTruthy()
      const name = await screen.getAllByText('Nom')
      expect(name).toBeTruthy()
      const date = await screen.getAllByText('Date')
      expect(date).toBeTruthy()
      const sum = await screen.getAllByText('Montant')
      expect(sum).toBeTruthy()
      const status = await screen.getAllByText('Statut')
      expect(status).toBeTruthy()
      const actions = await screen.getAllByText('Actions')
      expect(actions).toBeTruthy()

      await waitFor(() => screen.queryAllByTestId('icon-eye'))
      const eye = screen.queryAllByTestId('icon-eye')
      expect(eye).toBeTruthy()
    })

  })

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick); // c'est quoi?
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  
  })

})
