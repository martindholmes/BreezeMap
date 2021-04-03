<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:math="http://www.w3.org/2005/xpath-functions/math"
  xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl"
  xmlns:map="http://www.w3.org/2005/xpath-functions"
  exclude-result-prefixes="#all"
  version="3.0">
  <xd:doc scope="stylesheet">
    <xd:desc>
      <xd:p><xd:b>Created on:</xd:b> Mar 31, 2021</xd:p>
      <xd:p><xd:b>Author:</xd:b> mholmes</xd:p>
      <xd:p>This stylesheet simply parses a downloaded 
      JSON file and saves out a text file containing the 
      path to the latest OpenLayers distro.</xd:p>
    </xd:desc>
  </xd:doc>
  
  <xd:doc>
    <xd:desc>Project root directory is passed as a parameter.</xd:desc>
  </xd:doc>
  <xsl:param name="projDir" as="xs:string" select="'./..'"/>
  
  <xd:doc>
    <xd:desc>Output is plain text.</xd:desc>
  </xd:doc>
  <xsl:output method="text" encoding="UTF-8" normalization-form="NFC"/>
  
 <xsl:template match="/">
   <xsl:variable name="jsonPath" as="xs:string" select="$projDir || '/js/ol_latest.json'"/>
   <xsl:variable name="outputFile" as="xs:string" select="replace($jsonPath, '\.json$', '.txt')"/>
   <xsl:message expand-text="yes">Attempting to parse {$jsonPath} and write URL to {$outputFile}.</xsl:message>
   
   <xsl:variable name="jsonStr" select="unparsed-text($jsonPath)"/>

   <xsl:variable as="document-node()" name="jsonXml" select="json-to-xml($jsonStr)"/>
   

   <xsl:variable as="xs:string" name="browser_download_url" select="$jsonXml/descendant::*:string[@key='browser_download_url'][1]/text()"/>

   <xsl:result-document href="{$outputFile}"><xsl:sequence select="$browser_download_url"/></xsl:result-document>

 </xsl:template>
  
  
</xsl:stylesheet>