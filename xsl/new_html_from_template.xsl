<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl"
    exclude-result-prefixes="#all"
    xmlns:hcmc="http://hcmc.uvic.ca/ns"
    xmlns="http://www.tei-c.org/ns/1.0"
    xpath-default-namespace="http://www.tei-c.org/ns/1.0"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:xh="http://www.w3.org/1999/xhtml"
    version="3.0">
    <xd:doc scope="stylesheet">
        <xd:desc>
            <xd:p><xd:b>Created in:</xd:b> April 2021.</xd:p>
            <xd:p><xd:b>Author:</xd:b> mholmes</xd:p>
            <xd:p>This stylesheet receives two paths as input, 
            one being the location of an HTML template file which 
            will be transformed, and the other the location of a
            TEI XML file which will provide some information to be
            inserted into the HTML document. It loads both, and 
            creates an output file in the testsite folder.</xd:p>
          <xd:p>The file runs on itself and loads its resources
          dynamically.</xd:p>
        </xd:desc>
    </xd:doc>
    
  <xd:doc>
    <xd:desc>We may not need the functions, since this is a relatively
    simple process.</xd:desc>
  </xd:doc>
  <xsl:include href="functions_module.xsl"/>
  
  <xd:doc>
    <xd:desc>We're creating good old XHTML5.</xd:desc>
  </xd:doc>
  <xsl:output method="xhtml" html-version="5" encoding="UTF-8" exclude-result-prefixes="#all"
    normalization-form="NFC"  />
  
  <xd:doc>
    <xd:desc>This is a base directory in case we need to calculate any paths.</xd:desc>
  </xd:doc>
  <xsl:param name="projDir" as="xs:string" select="'..'"/>
  
  <xd:doc>
    <xd:desc>The location of the TEI file to use.</xd:desc>
  </xd:doc>
  <xsl:param name="inputXml" as="xs:string"/>
  
  <xd:doc>
    <xd:desc>The location of the template file to use.</xd:desc>
  </xd:doc>
  <xsl:param name="templateHtml" as="xs:string" select="$projDir || '/templates/BreezeMap.html'"/>
  
  <xd:doc>
    <xd:desc>The root template that kicks everything off.</xd:desc>
  </xd:doc>
  <xsl:template match="/">
    <!-- TODO. -->
  </xsl:template>
  
</xsl:stylesheet>