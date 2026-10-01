import {useEffect,useState} from 'react';
import {Navigate} from 'react-router-dom';
import {api} from '../api';
export default function Protected({role,children}){const [state,setState]=useState({loading:true});useEffect(()=>{let active=true;api('/auth/me').then(user=>active&&setState({user})).catch(error=>active&&setState({error}));return()=>{active=false;};},[]);if(state.loading)return <p className="p-10">Đang kiểm tra phiên đăng nhập...</p>;if(state.error)return <Navigate to="/login" replace/>;if(role&&state.user.role!==role)return <Navigate to={state.user.role==='MANAGER'?'/admin':'/employee'} replace/>;return children;}
