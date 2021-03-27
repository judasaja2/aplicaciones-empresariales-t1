import React from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import './index.css';
const rax = require('retry-axios');
const axios = require('axios');


function Anchor(props){
  return(
    <a href="#" onClick={props.handleAnchorClick} className={props.className}>{props.number}</a>
  )
}


class Search extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      value: '',
      pagination: true,
      activePage: 1,
      anchors: Array(5).fill(null),
      search: '',
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleAnchorClick = this.handleAnchorClick.bind(this);
  }

  async get_request(url){
    const axiosInstance = axios.create();
    axiosInstance.defaults.timeout = 750;
    axiosInstance.defaults.raxConfig = {
      instance: axiosInstance
    };
    const interceptorId = rax.attach(axiosInstance);
    return axiosInstance.get(url, {
    headers: {
      'Authorization': 'Bearer $ACCESS_TOKEN',
    },
    raxConfig: {
      retry: 3,
      noResponseRetries: 3,
      retryDelay: 0,
    },
    responseType: 'json',
    })
    .then(function(response){
      return(response.data)
    })
    .catch(function(error){
      console.log(error)
      return({results: "error"})
    })
  }

  async search_items(item_name){
    const offset = (this.state.activePage-1) * this.props.limit;
    const response = await this.get_request("https://api.mercadolibre.com/sites/MCO/search?q=" + item_name + "&limit=" + this.props.limit + "&offset=" + offset + "&attributes=results")
    return(response.results)
  }

  async search_users(users_ids){
    const response = await this.get_request("https://api.mercadolibre.com/users?ids=" + users_ids)
    //console.log(response)
    return(await response)
  }

  format_image(img_url){
    return(img_url.substring(0, img_url.length-5)+"O.jpg")
  }

  compute_discount(original_price, price){
    const number = 100*(1-(price/original_price))
    let number_string = number.toString().substring(0, 2)
    if(number_string == "-I" || original_price == "null"){
      number_string = "0"
    }
    if(number_string[1] == "."){
      number_string = number_string.substring(0,1)
    }
    const percentage = (number_string + "%")
    return(number_string)
  }

  async search(itemToSearch){
    const items = await this.search_items(itemToSearch)
    const nicknames = []
    const response = []
    try{
      let sellers_id = items[0].seller.id
      for(let i = 1; i < items.length; i++){
        sellers_id += ","+items[i].seller.id
      }
      const sellers = await this.search_users(sellers_id)
      for(let i = 0; i < items.length; i++){
        for(let j = 0; j < sellers.length; j++){
          if(items[i].seller.id === sellers[j].body.id){
            nicknames.push(sellers[j].body.nickname)
          }
        }
      }
      for(let i = 0; i < items.length; i++){
        const image_formatted = this.format_image(items[i].thumbnail)
        const discount = this.compute_discount(items[i].original_price, items[i].price)
        const item = {
          id: items[i].id,
          price: items[i].price,
          title: items[i].title,
          thumbnail: image_formatted,
          seller: {
            id: items[i].seller.id,
            name: nicknames[i]
          },
          discount: discount
        }
        response.push(item)
      }
      return(response)
    } catch(error){
      console.log(error)
      return("error")
    }
  }

  handleChange(event) {    
    this.setState({value: event.target.value});
  }

  async handleSearch(event) {
    event.preventDefault();
    if(this.state.value === ""){
      return(0)
    }
    await this.setState({activePage: 1})
    await this.setState({search: this.state.value})
    const results = await this.search(this.state.search)
    if(results === "error"){
      console.log("It was not possible to retrieve data.")
      return(0)
    }
    this.props.handleSearchClick(results)
    this.renderPaginator();
  }

  async handleAnchorClick(i){
    await this.setState(activePage => ({activePage: i}))
    if(this.state.value === ""){
      return(0)
    }
    let results = await this.search(this.state.search)
    if(results === "error"){
      console.log("It was not possible to retrieve data.")
      return(0)
    }
    this.props.handleSearchClick(results)
    this.renderPaginator();
  }

  renderAnchor(i){
    const className = this.state.activePage === i ? "active" : "inactive"
    return (
      <Anchor
        handleAnchorClick={() => this.handleAnchorClick(i)}
        number={i}
        className={className}
      />
    );
  }

  renderPaginator(){
    const anchors = this.state.anchors.slice();
    if(this.state.activePage <= 3){
      for(let i = 0; i < this.state.anchors.length; i++){
        anchors[i] = this.renderAnchor(i+1)
      }
    } else{
      for(let i = this.state.activePage; i < (this.state.activePage+5); i++){
        anchors[i-this.state.activePage] = this.renderAnchor(i-2)
      }
    }
    this.setState({anchors: anchors})
  }

  render(){
    return(
      <div className="search_div">
        <table className="search_table">
          <thead>
            <tr>
            <td className="name" colSpan="2">
                <h1 className="name">Juan David Sánchez Jaramillo: Tienda</h1>
              </td>
            </tr>
            <tr>
              <td>
                <form onSubmit={this.handleSearch}>        
                  <h3 className="search_h3">Producto:</h3>
                  <input type="text" value={this.state.value} onChange={this.handleChange}/>
                  <input className="search_submit" type="submit" value="Buscar"/>
                </form>
              </td>
              <td>
              <div className="pagination">
                {this.state.anchors}
              </div>
              </td>
            </tr>
          </thead>
        </table>
      </div>
    )
  }
}



function Item(props){
  return(
    <div>
      <table className ={props.className}>
        <thead>
        <tr className="item_table_row">
          <td className="item_td_left"><img className="item_image" src={props.image} alt={props.altimg} width="224" height="224"></img></td>
          <td className="item_td_right">
            <ul className="item_unordered_list">
              <h2>{props.name}</h2>
              <li><h3>$ {props.price}</h3></li>
              <li>Vendedor: {props.seller}</li>
            </ul>
          </td>
        </tr>
        <tr className="item_table_row">
          <td className="item_td_button" colSpan="2"><button onClick={props.openModal} className="item_button">Más información</button></td>
        </tr>
        </thead>
      </table>
    </div>
  );
}


function DetailedItem(props){
  return(
    <div>
      <table className="detailed_item_table">
        <thead>
        <tr className="detailed_item">
          <td className="item_td_detailed_left">
            <img className="item_image" src={props.image} alt={props.altimg} width="224" height="224"></img>
          </td>
          <td className="item_td_detailed_center">
            <ul className="item_unordered_list">
              <h2>{props.name}</h2>
              <li><h3>$ {props.price}</h3></li>
              <li>Vendedor: {props.seller}</li>
              <li>Descuento: {props.discount}</li>
            </ul>
          </td>
          <td className="item_td_detailed_right">
            <ul className="detailed_item_ul">
              <h2>** Calificación: {props.reviewsAmount > 0 ? (props.rating_average + " con " + props.reviewsAmount + " Opiniones") : "Por definir"}</h2>
              {props.reviews.map(function (review){
                return (
                <li> 
                  <h3>* {review.title}</h3>
                  <label>{review.content}</label>
                </li>
                )
              })}
            </ul>
          </td>
        </tr>
        </thead>
      </table>
    </div>
  );
}


function formatPrice(unformatted_price){
  const price = unformatted_price.toString();
  let formattedPrice = ""
  for(let i = price.length; i >= 0; i--){
    if(i !== price.length && (i-price.length+1)%3 === 0){
      formattedPrice += "."
    }
    formattedPrice += price[i];
  }
  formattedPrice = formattedPrice.split("").reverse().join("")
  formattedPrice = formattedPrice.substring(0, (formattedPrice.length-10))
  return(formattedPrice)
}


async function get_request(url){
  const axiosInstance = axios.create();
  axiosInstance.defaults.timeout = 500;
  axiosInstance.defaults.raxConfig = {
    instance: axiosInstance
  };
  const interceptorId = rax.attach(axiosInstance);
  return axiosInstance.get(url, {
  headers: {
    'Authorization': 'Bearer $ACCESS_TOKEN',
  },
  raxConfig: {
    retry: 3,
    noResponseRetries: 3,
    retryDelay: 0,
  },
  responseType: 'json',
  })
  .then(function(response){
    return(response.data)
  })
  .catch(function(error){
    console.log(error)
    return({results: "error"})
  })
}


class Shop extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      items: 20,
      leftItems: Array(10).fill(null),
      rightItems: Array(10).fill(null),
      reviews: Array(20).fill(null),
      detailedItem: null,
      detailedItem: -1,
      modalIsOpen: false,
    }
    this.handleSearchClick = this.handleSearchClick.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  renderItem(item, class_name) {
    return (
      <Item 
        id={item.item_id}
        price={item.item_price}
        name={item.item_name}
        image={item.item_image}
        altimg={item.item_altimg}
        seller={item.item_seller}
        seller_id={item.item_seller_id}
        className={class_name}
        number={item.item_number}
        discount={item.item_discount}
        openModal={() => this.openModal(item.item_number)}
      />
    );
  }

  async search_opinions(item_id){
    const response = await get_request("https://api.mercadolibre.com/reviews/item/" + item_id)
    return({reviews: response.reviews, rating_average: response.rating_average})
  }

  async handleSearchClick(results) {
    const leftItems = this.state.leftItems.slice();
    const rightItems = this.state.rightItems.slice();
    for(let i = 0; i < results.length; i++){
      if(i < results.length/2){
        const formatted_price = formatPrice(results[i].price)
        const item = {
          item_id: results[i].id,
          item_price: formatted_price,
          item_name: results[i].title,
          item_image: results[i].thumbnail,
          item_altimg: results[i].id+"_img",
          item_seller_id: results[i].seller.id,
          item_seller: results[i].seller.name,
          item_discount: results[i].discount,
          item_number: i,
        }
        if(i === 0){
          leftItems[i] = this.renderItem(item, "firstItem")
        } else{
          leftItems[i] = this.renderItem(item, "item_table")
        }
      } else {
        const formatted_price = formatPrice(results[i].price)
        const item = {
          item_id: results[i].id,
          item_price: formatted_price,
          item_name: results[i].title,
          item_image: results[i].thumbnail,
          item_altimg: results[i].id+"_img",
          item_seller_id: results[i].seller.id,
          item_seller: results[i].seller.name,
          item_discount: results[i].discount,
          item_number: i,
        }
        if(i === 10){
          rightItems[i-10] = this.renderItem(item, "firstItem")
        } else{
          rightItems[i-10] = this.renderItem(item, "item_table")
        }
      }
    }
    this.setState({leftItems: leftItems, rightItems: rightItems})
  }

  async openModal (item_number) {
    console.log(this.state.leftItems)
    if(item_number < 10){
      const reviews = await this.search_opinions(this.state.leftItems[item_number].props.id)
      const detailedItem = {reviews: reviews.reviews, reviewsAmount: reviews.reviews.length, rating_average: reviews.rating_average}
      this.setState({detailedItemNumber: item_number, detailedItem: detailedItem})
    } else{
      const reviews = await this.search_opinions(this.state.rightItems[item_number-10].props.id)
      const detailedItem = {reviews: reviews.reviews, reviewsAmount: reviews.reviews.length, rating_average: reviews.rating_average}
      this.setState({detailedItemNumber: item_number, detailedItem: detailedItem})
    }
    this.setState({ modalIsOpen: true });
  };

  closeModal = () => {
    this.setState({ modalIsOpen: false });
  };

  render() {
    return (
      <div className="shop">
        <link rel="shortcut icon" href="#"></link>
        <div className="shop-board">
          <Search 
            limit={this.state.items}
            handleSearchClick={this.handleSearchClick}
            reviews={this.state.reviews}
          />
          <table className="items">
            <thead >
            <tr>
              <td >
                <div className="render_items_div">{this.state.leftItems}</div>
              </td>
              <td >
                <div className="render_items_div">{this.state.rightItems}</div>
              </td>
            </tr>
            </thead>
          </table>
          <Modal 
            isOpen={this.state.modalIsOpen}
            onRequestClose={this.closeModal}>
            <div className="button_container">
              <button className="modal_button" onClick={this.closeModal}>Más resultados</button>
            </div>
            <DetailedItem
              image={this.state.detailedItemNumber >= 0 ? 
                (this.state.detailedItemNumber < 10  ? this.state.leftItems[this.state.detailedItemNumber].props.image 
                  : this.state.rightItems[this.state.detailedItemNumber%10].props.image) 
                : null}
              name={this.state.detailedItemNumber >= 0 ? 
                (this.state.detailedItemNumber < 10  ? this.state.leftItems[this.state.detailedItemNumber].props.name 
                  : this.state.rightItems[this.state.detailedItemNumber%10].props.name) 
                : null}
              price={this.state.detailedItemNumber >= 0 ? 
                (this.state.detailedItemNumber < 10  ? this.state.leftItems[this.state.detailedItemNumber].props.price 
                  : this.state.rightItems[this.state.detailedItemNumber%10].props.price) 
                : null}
              seller={this.state.detailedItemNumber >= 0 ? 
                (this.state.detailedItemNumber < 10  ? this.state.leftItems[this.state.detailedItemNumber].props.seller 
                  : this.state.rightItems[this.state.detailedItemNumber%10].props.seller) 
                : null}
              discount={this.state.detailedItemNumber >= 0 ? 
                (this.state.detailedItemNumber < 10  ? this.state.leftItems[this.state.detailedItemNumber].props.discount + "%"
                  : this.state.rightItems[this.state.detailedItemNumber%10].props.discount + "%") 
                : null}
              rating_average={this.state.detailedItem.rating_average}
              reviewsAmount={this.state.detailedItem.reviewsAmount}
              reviews={this.state.detailedItem.reviews}
            /> 
          </Modal>
        </div>
      </div>
    );
  }
}

// ============================================================
/* eslint-disable */
console.log = console.warn = console.error = () => {};

ReactDOM.render(
  <Shop />,
  document.getElementById('root')
);  