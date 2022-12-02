import React, {useRef, VFC} from 'react';
import Image from 'next/image';
import {useLanguage} from '../hooks/useLanguage';
import {Icon} from '@chakra-ui/react';
import {AiFillTwitterCircle, AiOutlineInstagram} from 'react-icons/ai';
import Link from 'next/link';


export const AuthorCard: VFC<any> = ({name, profession, image, twitter, instagram}) => {
  const language = useLanguage();
  return (
    <div className={'authorCardContainer'}>
      {image && <Image className={'authorCardImage'}
        src={image}
        width={'130%'} height={'130%'}
        objectFit={'contain'}/>
      }      <div className={'authorCardName'}>
        {name}
      </div>
      <div className={'authorCardProfession'}>
        {profession}
      </div>
      <div className={'snsIconList'}>
        {twitter && <a href={twitter} target={'_blank'}
          rel="noopener noreferrer">
          <Icon className={'snsIcon'}
            as={AiFillTwitterCircle}
            color={'skyblue'} width={16}
            height={16}/>
        </a>}
        {instagram && <a href={instagram} target={'_blank'}
          rel="noopener noreferrer">
          <Icon className={'snsIcon'}
            as={AiOutlineInstagram}
            color={'magenta'}
            width={16}
            height={16}/>
        </a>
        }
      </div>
    </div>
  );
};

