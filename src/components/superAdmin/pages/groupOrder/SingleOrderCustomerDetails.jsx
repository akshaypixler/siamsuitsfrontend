import React, { useContext, useEffect, useState } from "react";
import "./SingleOrderCustomerDetails.css";
import { Link } from "react-router-dom";
import { axiosInstance, axiosInstance2 } from "./../../../../config";
import { Context } from "./../../../../context/Context";
import { useNavigate } from "react-router-dom";
import { PicBaseUrl, PicBaseUrl3, PicBaseUrl4 } from "./../../../../imageBaseURL";
import CircularProgress from '@mui/material/CircularProgress';
import Button from "@mui/material/Button";
import { useLocation } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
// import 'single';

export default function SingleOrderCustomerDetails(){
  
  const location = useLocation();
  const path = location.pathname.split("/")[3];
  const [order, setOrder] = useState([]);
  const { user } = useContext(Context);
  const [generatePDFButton, setGeneratePDFButton] = useState(false)
  const navigate = useNavigate();
  const [productFeaturesObject, setProductFeaturesObject] = useState({})
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchOrder(path)
    fetchProducts()


  }, [])

  const handlePrintPDF = async(e) => {
    setGeneratePDFButton(true)
    const newOrderObject = JSON.parse(JSON.stringify(order[0]))
    const thisCustomer = order[0]['customers'].filter((customer) => customer['_id'] == e.target.dataset.customerid)
    console.log("customer: ", thisCustomer)
    delete newOrderObject['customers']
    delete newOrderObject['customer_quantity']
    newOrderObject['customerName'] = thisCustomer[0]['firstname'] + " " + thisCustomer[0]['lastname']
    newOrderObject['customer_id'] = thisCustomer[0]
    if(thisCustomer[0]['manualSize']){
      newOrderObject['manualSize'] = thisCustomer[0]['manualSize'] 
    }
    if(thisCustomer[0]['measurementsObject']){
      newOrderObject['measurements'] = thisCustomer[0]['measurementsObject']
    }
    
    for(let x of order[0]['order_items']){
      if(x['item_name'] == "suit"){
        const suitMeas = {
          jacket: thisCustomer[0]['measurementsObject']['jacket'],
          pant: thisCustomer[0]['measurementsObject']['pant']
        }
        newOrderObject['Suitmeasurements'] = suitMeas
      }
    }
    // console
    let draftMeasurementsObj = {}
      const existingOrders = await axiosInstance2.post("/customerOrders/fetchCustomerOrders/" + thisCustomer[0]['_id'], {token: user.data.token})

// console.log("existing orders ", existingOrders)
      // draftMeasurementsObj = existingOrders.data.data[0]['measurements']
  
      if(existingOrders.data.status == true){
        let ind = 0;
        let ourIndex ;
        for(let x of existingOrders.data.data){
          if(x['_id'] == order){
            ourIndex = ind
          }
          ind = ind + 1
        }  
        if(existingOrders.data.data.length > 1)
        {
          draftMeasurementsObj = existingOrders.data.data[0]['measurements']
        }
      }
    // }
    exportPDF(newOrderObject, draftMeasurementsObj)
  }

  const exportPDF = async (thisOrder, draftMeasurementsObj) => {

    let orderItemsArrayPDF = [];

    let justAnArray = [];



    // const res = await axiosInstance.post(
    //   "/customerOrders/fetchOrderByID/" + order,
    //   { token: user.data.token }
    // );
    


    const res1 = await axiosInstance2.post('/retailer/fetch', {
      token: user.data.token,
      id: thisOrder['retailer_id']
    })


    var retailerObject = res1.data.data[0]


    let orderItemsArray = [];
    for (let m of thisOrder["order_items"]) {
      if (m.item_name == "suit") {
        for (let n = 1; n <= Object.keys(m["styles"][0]).length; n++) {
          let itemsObject1 = {
            item_name: m["item_name"],
            item_code: "jacket " + n,
            quantity: m["quantity"],
            styles: m["styles"][0][Object.keys(m["styles"][0])[n - 1]],
          };
          let itemsObject2 = {
            item_name: m["item_name"],
            item_code: "pant " + n,
            quantity: m["quantity"],
            styles: m["styles"][0][Object.keys(m["styles"][0])[n - 1]],
          };
          orderItemsArray.push(itemsObject1);          
          orderItemsArray.push(itemsObject2);
        }
      } else {
        for (let n = 1; n <= Object.keys(m["styles"][0]).length; n++) {
          let itemsObject = {
            item_name: m["item_name"],
            item_code: m["item_name"] + " " + n,
            quantity: m["quantity"],
            styles: m["styles"][0][Object.keys(m["styles"][0])[n - 1]],
          };
          orderItemsArray.push(itemsObject);
        }
      }
      // for (let n = 1; n <= Object.keys(m["styles"][0]).length; n++) {
      //   let itemsObject = {
      //     item_name: m["item_name"],
      //     item_code: m["item_name"] + " " + n,
      //     quantity: m["quantity"],
      //     styles: m["styles"][0][Object.keys(m["styles"][0])[n - 1]],
      //   };
      //   orderItemsArray.push(itemsObject);
      // }
    }

    let j = 1;

    for (let m of thisOrder["order_items"]) {
      if (m.item_name == "suit") {
        for (let n = 1; n <= Object.keys(m["styles"][0]).length; n++) {
          let itemsObject1 = {
            item_name: m["item_name"],
            item_code: "jacket " + n,
            quantity: m["quantity"],
            repeatOrder: thisOrder["repeatOrder"],
            styles: m["styles"][0][Object.keys(m["styles"][0])[n - 1]],
          };

          if (j % 5 == 0 || orderItemsArray.length == j) {
            justAnArray.push(itemsObject1);
            orderItemsArrayPDF.push(justAnArray);
            justAnArray = [];
          } else {
            justAnArray.push(itemsObject1);
          }

          j = j + 1;

          let itemsObject2 = {
            item_name: m["item_name"],
            item_code:  "pant " + n,
            quantity: m["quantity"],
            repeatOrder: thisOrder["repeatOrder"],
            styles: m["styles"][0][Object.keys(m["styles"][0])[n - 1]],
          };

          if (j % 5 == 0 || orderItemsArray.length == j) {
            justAnArray.push(itemsObject2);
            orderItemsArrayPDF.push(justAnArray);
            justAnArray = [];
          } else {
            justAnArray.push(itemsObject2);
          }

          j = j + 1;
        }

        
      } else {
        for (let n = 1; n <= Object.keys(m["styles"][0]).length; n++) {
          let itemsObject = {
            item_name: m["item_name"],
            item_code: m["item_name"] + " " + n,
            quantity: m["quantity"],
            repeatOrder: thisOrder["repeatOrder"],
            styles: m["styles"][0][Object.keys(m["styles"][0])[n - 1]],
          };
          if (j % 5 == 0 || orderItemsArray.length == j) {
            justAnArray.push(itemsObject);
            orderItemsArrayPDF.push(justAnArray);
            justAnArray = [];
          } else {
            justAnArray.push(itemsObject);
          }

          j = j + 1;
        }
      }
    }

    let singleOrderArray = [];

    for (let m of thisOrder["order_items"]) {
      if (m.item_name == "suit") {
        for (let n = 1; n <= Object.keys(m["styles"][0]).length; n++) {

          let itemsObject1 = {
             item_name: m["item_name"],
             item_code: "jacket " + n,
             quantity: m["quantity"],
             styles: m["styles"][0][Object.keys(m["styles"][0])[n - 1]],
             measurementsObject: thisOrder.Suitmeasurements['jacket'],
             manualSize:
               thisOrder.manualSize == null ? (
                 <></>
               ) : (
                 thisOrder.manualSize["jacket"]
               ),
           };

           let itemsObject2 = {
             item_name: m["item_name"],
             item_code: "pant " + n,
             quantity: m["quantity"],
             styles: m["styles"][0][Object.keys(m["styles"][0])[n - 1]],
             measurementsObject: thisOrder.Suitmeasurements['pant'],
             manualSize:
               thisOrder.manualSize == null ? (
                 <></>
               ) : (
                 thisOrder.manualSize["pant"]
               ),
           };
           
           singleOrderArray.push(itemsObject1);
           
           singleOrderArray.push(itemsObject2);

       }
      } else {
        for (let n = 1; n <= Object.keys(m["styles"][0]).length; n++) {
          let itemsObject = {
            item_name: m["item_name"],
            item_code: m["item_name"] + " " + n,
            quantity: m["quantity"],
            styles: m["styles"][0][Object.keys(m["styles"][0])[n - 1]],
            measurementsObject: thisOrder.measurements[m["item_name"]],
            manualSize:
            thisOrder.manualSize == null ? (
                <></>
              ) : (
                thisOrder.manualSize[m["item_name"]]
              ),
          };
          singleOrderArray.push(itemsObject);
        }
      }
    }

    const orderItemsArrayPDFString = JSON.stringify(orderItemsArrayPDF)

    const singleOrderArrayString = JSON.stringify(singleOrderArray)


    const productFeaturesObjectString = JSON.stringify(productFeaturesObject)
    const draftMeasurementsObjString = JSON.stringify(draftMeasurementsObj)

    const pdfString = await axiosInstance2.post('groupOrders/createPdf', {
      token: user.data.token,
      productFeaturesObject: productFeaturesObjectString,
      orderItemsArray: orderItemsArrayPDFString, 
      singleOrderArray: singleOrderArrayString,
      draftMeasurementsObj: draftMeasurementsObjString,
      order: JSON.stringify(thisOrder),
      retailer: JSON.stringify(res1.data.data[0])
    })
    // if(pdfString.data.status === true){
      setGeneratePDFButton(false)
      // setSnackbarOpen(true);
      // setSuccess(true);
      // setsuccessMsg("Group order place Successfully........");
      window.location.reload(false);
    // }
  };

  const handleOpenPdf = async(data) => {
    // console.log("pdf: ", stringPdf)
    
    // const url = PicBaseUrl4 + stringPdf;
    // window.open(url);
    const string = data.split(".pdf")[0]
    const res =  await axiosInstance.post('customerOrders/checkPdf', {
      token: user.data.token,
      pdf: string.split("/")[1]
    })
    if(res.data.status == true){
      const stringPdf = data.split(".pdf")[0]
      const url = PicBaseUrl4 + stringPdf;
      window.open(url);
    }else{
      // setErrorMsg(res.data.message)
      // setSuccess(false)
      // setError(true)
    }

  }

  const fetchOrder = async(id) => {
    const res = await axiosInstance.post("/groupOrders/fetchDatag/" + id, {token: user.data.token})
    setOrder(res.data.data)
  }
  
  const fetchProducts = async () => {
    const res = await axiosInstance.post("/product/fetchAll/0/0", {
      token: user.data.token,
    });
    const productObject = {}
    for(let x of res.data.data){
      const featureArray = []
      for(let y of x.features){
        if(y.additional == false){
          featureArray.push(y.name)
        }
      }
      productObject[x.name] = featureArray

    }
    setProductFeaturesObject(productObject)
    setProducts(res.data.data);
  };


  return(
    <main className="main-panel">   

      <div className="singlePageOuter">
        <div className="detailHeader">
          <div className="customerName">
            <h3><span>Group Name:</span> {order[0] !== undefined ? order[0]['name'].toUpperCase() : ""}</h3>
            <h3><span>Retailer:</span>{order[0] !== undefined ? order[0]['retailerName'].toUpperCase() : ""}</h3>
          </div>
          <div className="customerDetails">

            {order[0] !== undefined
            ?
            order[0]['order_items'].map((item, i) => {
              return(
                <p key={i}> {item['quantity'] + " "}<span style={{textTransform: "capitalize"}}>{item['item_name']}</span> </p>
              )
            })
            :
            
            <></>}

          </div>
        </div>
          <div className="tableDataOuter">
            <table>
              <thead>
                <th><strong>S No. </strong></th>
                <th><strong>Customer Name </strong></th>
                <th><strong>Generate</strong></th>
                <th><strong>Print / Edit </strong></th>
              </thead>
              <tbody>
                    {order[0] !== undefined
                    ?
                    order[0]['customers'].map((customer, index) => {
                      return(
                        <tr key={customer['_id']}>
                          <td>{index + 1}</td>
                          <td><span style={{textTransform: "capitalize"}}>{customer['firstname']}</span>{" "}<span style={{textTransform: "capitalize"}}>{customer['lastname']}</span></td>
                          <td> <span className="generatePDf" onClick={handlePrintPDF} data-customerId = {customer['_id']} style={{color: "#1C4D8F", fontWeight: "600"}}>Generate</span></td>
                          {
                          order[0]['pdf'] && order[0]['pdf'][customer['_id']]
                          ?
                          <td> <span className="generatePDf action" onClick={() => handleOpenPdf(order[0]['pdf'][customer['_id']])} target="_blank" rel="noreferrer" data-customerId = {customer['_id']} style={{color: "#1C4D8F", fontWeight: "600"}}>View</span></td>
                          :
                          <td> <span target="_blank" rel="noreferrer" className="action" data-customerId = {customer['_id']} style={{color: "#1C4D8F", fontWeight: "600"}}>N/A</span></td>
                          }                          
                        </tr>
                      )
                    })
                    :
                    <></>}
              </tbody>
            </table>
          </div>
          <div>
            <Link to="/groupOrder/GroupOrder" className="custom-btn">Close</Link>
          </div>

        <Dialog
          open={generatePDFButton}
          // onClose={}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
          </DialogTitle>
          <DialogContent>
            <div>
              <CircularProgress/>
            </div>
          </DialogContent>
        </Dialog> 
      </div>
    </main>
  )
}