import React from 'react';
import styled, { css } from 'styled-components';

const Button = styled.button`
    color: #7F353E;
    border: 1px #7F353E solid;
    /* background-color: #C33646;
    color: #fff !important; */
    /* border: none; */
    padding: 6px 12px;
    border-radius: 8px;
    font-family: 'Mitr', sans-serif;
    font-size: 1rem;
    text-decoration: none;
    margin: 0;
    display: inline-block;
    
    ${props => props.isFullWidth && css`
        display: block;
        width: auto;
    `}

    ${props => props.mb && css`
        margin-bottom: 16px;
    `}

    &:hover {
        background-color: #7F353E;
        color: #fff !important;
        border: none;
    }
`;

export default Button;